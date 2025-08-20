# Supabase Authentication Hardening

## Required Settings (Dashboard)

### 1) OTP Expiry = 5 minutes
Auth → Templates → Sign Up Confirmation → Set expiry to 300 seconds.

### 2) Leaked Password Protection = ON
Auth → Settings → Security → Enable "Password breach detection".

### 3) Site URLs
Auth → URL Configuration:
- Site URL = your production domain (e.g., https://calmer.social)
- Redirect URLs = add production and preview domains with wildcards, e.g.:
  - https://calmer.social/**
  - https://<your-preview>.lovableproject.com/**

### Verification
- [ ] OTP expiry reflects 5 minutes
- [ ] Breach detection enabled
- [ ] Site/redirect URLs correct
- [ ] Signup/login flows tested end-to-end