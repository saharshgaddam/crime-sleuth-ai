
import authService from './authService';
import caseService from './caseService';
import evidenceService from './evidenceService';
import userService from './userService';
import forensicService from './forensicService';

// Export a default API object with all services
const API = {
  auth: authService,
  cases: caseService,
  evidence: evidenceService,
  users: userService,
  forensic: forensicService
};

export default API;

// Re-export types
export * from './types';
