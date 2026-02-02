# Test Execution Report Template

Copy this template and fill in after each test run.

---

# Test Report: [DATE]

## Execution Summary

| Field | Value |
|-------|-------|
| **Date** | YYYY-MM-DD |
| **Time Started** | HH:MM |
| **Time Completed** | HH:MM |
| **Duration** | X hours Y minutes |
| **Tester** | [Name or Agent] |
| **Environment** | localhost:3000 / staging / production |
| **Test Type** | Full Regression / Sprint / Critical Path |
| **Sprint Number** | (if sprint test) |
| **Git Commit** | (optional) |

---

## Results Overview

### Test Counts

| Metric | Count |
|--------|-------|
| **Total Tests Executed** | |
| **Passed** | |
| **Failed** | |
| **Skipped** | |
| **Blocked** | |
| **Pass Rate** | __% |

### By Suite

| Suite | Total | Pass | Fail | Skip |
|-------|-------|------|------|------|
| 00-Smoke | | | | |
| 01-Auth | | | | |
| 02-RBAC | | | | |
| 03-Projects | | | | |
| 04-Clients | | | | |
| 05-Tasks | | | | |
| 06-Team | | | | |
| 07-Finances | | | | |
| 08-Scheduling | | | | |
| 09-Documents | | | | |
| 10-Materials | | | | |
| 11-Settings | | | | |
| 12-Portals | | | | |
| **TOTAL** | | | | |

---

## Console Errors Captured

### Summary

| Severity | Count |
|----------|-------|
| **TypeError** | |
| **ReferenceError** | |
| **React Error** | |
| **Network Error** | |
| **Firebase Error** | |
| **Other Warning** | |
| **TOTAL** | |

### Error Details

#### Error 1
```
Type: [TypeError/etc]
Message:
Stack Trace:
File/Line:
Trigger: [What action caused this]
Frequency: [How many times occurred]
Affected Tests: [List test IDs]
```

#### Error 2
```
(repeat for each unique error)
```

---

## Failed Tests

### BLOCKER Failures

| Test ID | Test Name | Failure Reason | Screenshot |
|---------|-----------|----------------|------------|
| | | | |

### CRITICAL Failures

| Test ID | Test Name | Failure Reason | Screenshot |
|---------|-----------|----------------|------------|
| | | | |

### MAJOR Failures

| Test ID | Test Name | Failure Reason | Screenshot |
|---------|-----------|----------------|------------|
| | | | |

### MINOR Failures

| Test ID | Test Name | Failure Reason | Screenshot |
|---------|-----------|----------------|------------|
| | | | |

---

## Security Issues

| Test ID | Issue | Severity | Details |
|---------|-------|----------|---------|
| | | | |

---

## Network Errors

| Request URL | Status | Method | Test Context |
|-------------|--------|--------|--------------|
| | | | |

---

## Performance Observations

| Page/Action | Load Time | Notes |
|-------------|-----------|-------|
| Dashboard load | ms | |
| Project list | ms | |
| Create project | ms | |

---

## Bugfix Sprint Preparation

### Priority 1: Fix Immediately (Blockers)

1. **Issue ID:**
   - **Description:**
   - **Affected Tests:**
   - **Console Error:**
   - **Reproduction Steps:**
   - **Suggested Fix:**

### Priority 2: Fix Before Release (Critical/Major)

1. **Issue ID:**
   - **Description:**
   - **Affected Tests:**
   - **Suggested Fix:**

### Priority 3: Fix Next Sprint (Minor)

1. **Issue ID:**
   - **Description:**
   - **Affected Tests:**

---

## Regression Notes

### Tests That Previously Passed Now Fail

| Test ID | Last Pass Date | Current Status | Likely Cause |
|---------|----------------|----------------|--------------|
| | | | |

### Tests Fixed Since Last Run

| Test ID | Fixed Date | Fix Description |
|---------|------------|-----------------|
| | | |

---

## Recommendations

### Immediate Actions Required
1.
2.

### Before Next Release
1.
2.

### Technical Debt Noted
1.
2.

---

## Sign-Off

| Role | Name | Date | Approval |
|------|------|------|----------|
| QA Tester | | | PASS / FAIL |
| Dev Lead | | | APPROVED / PENDING |
| Product Owner | | | APPROVED / PENDING |

---

## Attachments

- [ ] Screenshots saved to: `reports/[date]/screenshots/`
- [ ] Console log exported to: `logs/[date]/console.log`
- [ ] Network log exported to: `logs/[date]/network.log`
- [ ] Video recording (if applicable):

---

## Notes

(Any additional observations, context, or comments)
