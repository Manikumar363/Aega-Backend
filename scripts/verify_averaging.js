import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function runAveragingTest() {
  console.log('--- Starting Overall Compliance Score Averaging Test ---');
  let adminToken;
  let universityId;

  // 1. Login as Admin
  try {
    console.log('1. Logging in as Admin...');
    const loginRes = await axios.post(`${BASE_URL}/auth/admin/login`, {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@1234'
    });
    adminToken = loginRes.data.token;
    if (!adminToken) {
      throw new Error('Admin login did not return token.');
    }
    console.log('Login successful.');
  } catch (error) {
    console.error('Failed to log in as admin:', error.response?.data || error.message);
    process.exit(1);
  }

  const adminClient = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  });

  // 2. Sign up a new University to ensure we start from a clean profile
  try {
    console.log('\n2. Signing up a test University...');
    const signupEmail = `averaging.uni.${Date.now()}@example.com`;
    await axios.post(`${BASE_URL}/auth/signup`, {
      firstName: 'Averaging',
      lastName: 'University',
      universityName: 'Averaging Test Academy',
      email: signupEmail,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      role: 'university',
      supportingDocument1: '/uploads/doc1.pdf',
      supportingDocument2: '/uploads/doc2.pdf'
    });
    console.log('University signup successful.');
  } catch (error) {
    console.error('Failed to signup university:', error.response?.data || error.message);
    process.exit(1);
  }

  // 3. Retrieve the created University ID
  try {
    console.log('\n3. Fetching university list as admin...');
    const listRes = await adminClient.get('/api/admin/universities');
    const universities = listRes.data.data;
    const university = universities.find(u => u.name === 'Averaging Test Academy');
    if (!university) {
      throw new Error('Averaging Test Academy profile not found.');
    }
    universityId = university._id;
    console.log(`Found University with ID: ${universityId}`);
  } catch (error) {
    console.error('Failed to find university:', error.response?.data || error.message);
    process.exit(1);
  }

  let categoryId;
  const criteriaIds = [];

  // 4. Create Audit Category for University
  try {
    console.log('\n4. Creating Compliance Category...');
    const catRes = await adminClient.post('/api/admin/audits', {
      name: `QA Averaging Audit - ${Date.now()}`,
      description: 'Audit category for testing averaging formula',
      target: 'university'
    });
    categoryId = catRes.data.data._id;
    console.log(`Category created with ID: ${categoryId}`);
  } catch (error) {
    console.error('Failed to create category:', error.response?.data || error.message);
    process.exit(1);
  }

  // 5. Add 3 Criteria
  const criteriaToAdd = [
    { criterion: 'Criterion 1', severity: 'low', evidence: 'Evidence 1' },
    { criterion: 'Criterion 2', severity: 'low', evidence: 'Evidence 2' },
    { criterion: 'Criterion 3', severity: 'high', evidence: 'Evidence 3' }
  ];

  try {
    console.log('\n5. Adding criteria...');
    for (const item of criteriaToAdd) {
      const critRes = await adminClient.post(`/api/admin/audits/${categoryId}/criteria`, item);
      criteriaIds.push(critRes.data.data._id);
    }
    console.log('Criteria added.');
  } catch (error) {
    console.error('Failed to add criteria:', error.response?.data || error.message);
    process.exit(1);
  }

  // 6. Submit FIRST Audit Check
  // Score = (100 + 100 + 33.33) / 3 = 77.78%
  let firstAuditScore;
  try {
    console.log('\n6. Submitting FIRST Audit Check...');
    const checkAnswers = [
      { criterionId: criteriaIds[0], status: 'compliant', severity: 'low' },
      { criterionId: criteriaIds[1], status: 'compliant', severity: 'low' },
      { criterionId: criteriaIds[2], status: 'non-compliant', severity: 'high', comment: 'Failed high-risk check' }
    ];

    const checkRes = await adminClient.post('/api/admin/audits/checks/submit', {
      targetType: 'university',
      targetId: universityId,
      categoryId,
      answers: checkAnswers
    });

    firstAuditScore = checkRes.data.data.complianceScore;
    console.log('First Audit Check Score:', firstAuditScore); // Expected ~77.78
  } catch (error) {
    console.error('Failed to submit first audit check:', error.response?.data || error.message);
    process.exit(1);
  }

  // Verify first check overall compliance is exactly firstAuditScore
  try {
    const detailRes = await adminClient.get(`/api/admin/universities/${universityId}`);
    const firstOverallScore = detailRes.data.data.complianceScore;
    console.log('Overall score after first audit:', firstOverallScore);
    if (Math.abs(firstOverallScore - firstAuditScore) > 0.01) {
      throw new Error(`Expected first overall score to equal first audit score (${firstAuditScore}), but got ${firstOverallScore}`);
    }
  } catch (error) {
    console.error('Failed to verify first overall score:', error.message);
    process.exit(1);
  }

  // 7. Submit SECOND Audit Check (score should be 100.00% - all compliant)
  let secondAuditScore;
  try {
    console.log('\n7. Submitting SECOND Audit Check (expecting average calculation)...');
    const checkAnswers = [
      { criterionId: criteriaIds[0], status: 'compliant', severity: 'low' },
      { criterionId: criteriaIds[1], status: 'compliant', severity: 'low' },
      { criterionId: criteriaIds[2], status: 'compliant', severity: 'high' }
    ];

    const checkRes = await adminClient.post('/api/admin/audits/checks/submit', {
      targetType: 'university',
      targetId: universityId,
      categoryId,
      answers: checkAnswers
    });

    secondAuditScore = checkRes.data.data.complianceScore;
    console.log('Second Audit Check Score:', secondAuditScore); // Expected 100.00
  } catch (error) {
    console.error('Failed to submit second audit check:', error.response?.data || error.message);
    process.exit(1);
  }

  // 8. Verify the new overall compliance score is the average: (firstAuditScore + secondAuditScore) / 2
  try {
    const detailRes = await adminClient.get(`/api/admin/universities/${universityId}`);
    const finalOverallScore = detailRes.data.data.complianceScore;
    const expectedAverage = Math.round(((firstAuditScore + secondAuditScore) / 2) * 100) / 100;
    console.log('Expected overall score:', expectedAverage);
    console.log('Actual overall score:', finalOverallScore);

    if (Math.abs(finalOverallScore - expectedAverage) > 0.01) {
      throw new Error(`Average formula verification failed! Expected ${expectedAverage}, but got ${finalOverallScore}`);
    }
    console.log('\n--- SUCCESS! Overall Compliance Score Averaging formula works perfectly! ---');
  } catch (error) {
    console.error('Averaging verification failed:', error.message);
    process.exit(1);
  }
}

runAveragingTest();
