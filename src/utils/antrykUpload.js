import 'dotenv/config';
import axios from 'axios';
import FormData from 'form-data';

const normalizeEnvValue = (value) => {
  if (value === undefined || value === null) return value;
  if (typeof value !== 'string') return value;
  return value.trim().replace(/^['"]|['"]$/g, '');
};

export const getAntrykConfig = () => {
  return {
    accessKey: normalizeEnvValue(process.env.ANTRYK_ACCESS_KEY),
    secretKey: normalizeEnvValue(process.env.ANTRYK_SECRET_KEY),
    bucket: normalizeEnvValue(process.env.ANTRYK_BUCKET_NAME),
    baseUrl: normalizeEnvValue(process.env.ANTRYK_BASE_URL),
    uploadUrl:
      normalizeEnvValue(process.env.ANTRYK_UPLOAD_URL) ||
      'https://storage.apis.antryk.com/api/v1/objects'
  };
};

export const sanitizeFileName = (name = '') => {
  const trimmed = String(name).trim();
  return (
    trimmed.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '').replace(/^\.+/, '') ||
    `file_${Date.now()}`
  );
};

export const getMissingAntrykEnv = () => {
  const { accessKey, secretKey, bucket } = getAntrykConfig();
  const required = {
    ANTRYK_ACCESS_KEY: accessKey,
    ANTRYK_SECRET_KEY: secretKey,
    ANTRYK_BUCKET_NAME: bucket
  };
  return Object.keys(required).filter((name) => !required[name] || String(required[name]).trim() === '');
};

export const buildPublicUrl = (key) => {
  const normalizedKey = String(key || '').replace(/^\/+/, '');
  return `/${normalizedKey}`;
};

export const formatUploadProviderError = (error) => {
  if (error.response) {
    const responseBody =
      typeof error.response.data === 'string'
        ? error.response.data
        : JSON.stringify(error.response.data);
    return `Upload provider returned ${error.response.status}: ${responseBody}`;
  }

  if (error.request) {
    return 'Upload provider did not respond';
  }

  return error.message || 'Unknown upload error';
};

const extractUploadedKey = (payload) => {
  if (!payload) return null;
  if (typeof payload === 'string') return payload;
  if (payload.key) return payload.key;
  if (payload.objectKey) return payload.objectKey;
  if (payload.data?.key) return payload.data.key;
  if (payload.data?.objectKey) return payload.data.objectKey;
  if (Array.isArray(payload.data?.files) && payload.data.files[0]?.key) return payload.data.files[0].key;
  if (Array.isArray(payload.files) && payload.files[0]?.key) return payload.files[0].key;
  return null;
};

const buildAuthAttempts = (accessKey, secretKey) => {
  const basicToken = Buffer.from(`${accessKey}:${secretKey}`).toString('base64');

  return [
    {
      name: 'x-access-key',
      headers: {
        'x-access-key': accessKey,
        'x-secret-key': secretKey
      },
      fields: {}
    },
    {
      name: 'x-antryk-access-key',
      headers: {
        'x-antryk-access-key': accessKey,
        'x-antryk-secret-key': secretKey
      },
      fields: {}
    },
    {
      name: 'x-api-key',
      headers: {
        'x-api-key': accessKey,
        'x-api-secret': secretKey
      },
      fields: {}
    },
    {
      name: 'authorization-basic',
      headers: {
        Authorization: `Basic ${basicToken}`
      },
      fields: {}
    },
    {
      name: 'form-fields',
      headers: {},
      fields: {
        accessKey,
        secretKey,
        access_key: accessKey,
        secret_key: secretKey,
        apiKey: accessKey,
        apiSecret: secretKey
      }
    }
  ];
};

const isInvalidCredentialError = (error) => {
  const data = error?.response?.data;
  const flattened = typeof data === 'string' ? data : JSON.stringify(data || {});
  return /invalid\s*credentials|unauthorized|code\s*":\s*401/i.test(flattened);
};

const uploadWithAttempt = async ({ file, key, bucket, uploadUrl, attempt }) => {
  const formData = new FormData();
  formData.append('file', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype
  });
  formData.append('key', key);
  formData.append('bucket', bucket);

  Object.entries(attempt.fields).forEach(([fieldName, fieldValue]) => {
    formData.append(fieldName, fieldValue);
  });

  const response = await axios.post(uploadUrl, formData, {
    headers: {
      ...formData.getHeaders(),
      ...attempt.headers
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  });

  return response;
};

export const uploadToAntryk = async (file, key) => {
  const { accessKey, secretKey, bucket, uploadUrl } = getAntrykConfig();

  const attempts = buildAuthAttempts(accessKey, secretKey);
  let lastError;
  let response;

  for (const attempt of attempts) {
    try {
      response = await uploadWithAttempt({ file, key, bucket, uploadUrl, attempt });
      break;
    } catch (error) {
      lastError = error;
      if (!isInvalidCredentialError(error)) {
        throw error;
      }
    }
  }

  if (!response) {
    throw lastError || new Error('Antryk upload failed: authentication attempts exhausted');
  }

  const uploadedKey = extractUploadedKey(response.data);
  if (!uploadedKey) {
    throw new Error('Antryk upload failed: key missing in provider response');
  }

  return { key: uploadedKey, raw: response.data };
};

export const antrykConfig = () => {
  const { uploadUrl, bucket, baseUrl } = getAntrykConfig();
  return { uploadUrl, bucket, baseUrl };
};
