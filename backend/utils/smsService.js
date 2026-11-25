/**
 * SMS OTP Service for BasketBee
 * Supports Fast2SMS (India), Twilio, MSG91, and a Development Mock fallback.
 */

export const sendSMSOTP = async (mobileNumber, otp) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const provider = (process.env.SMS_PROVIDER || '').toLowerCase();

  // Extract 10-digit Indian mobile number & +91 format
  const digits = String(mobileNumber).replace(/\D/g, '').slice(-10);
  const formattedPhone = `+91${digits}`;

  // 1. Fast2SMS Provider (Popular Indian Real SMS API)
  if ((provider === 'fast2sms' || process.env.FAST2SMS_API_KEY) && process.env.FAST2SMS_API_KEY) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: digits,
        }),
      });
      const data = await response.json();
      if (data.return) {
        console.log(`[Fast2SMS] Real SMS OTP sent to ${formattedPhone}`);
        return { success: true, provider: 'fast2sms', data };
      }
      console.error('[Fast2SMS Error]:', data);
      if (isProduction) {
        throw new Error(data.message || 'Failed to send SMS via Fast2SMS.');
      }
    } catch (err) {
      console.error('[Fast2SMS Error] Failed to send SMS:', err.message);
      if (isProduction) {
        throw new Error('Failed to send SMS via Fast2SMS.');
      }
    }
  }

  // 2. Twilio Provider
  if ((provider === 'twilio' || process.env.TWILIO_ACCOUNT_SID) && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilioModule = await import('twilio');
      const twilio = twilioModule.default || twilioModule;
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      const message = await client.messages.create({
        body: `Your BasketBee grocery verification code is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });

      console.log(`[Twilio SMS] Real SMS OTP sent to ${formattedPhone}, SID: ${message.sid}`);
      return { success: true, provider: 'twilio', sid: message.sid };
    } catch (err) {
      console.error('[Twilio Error] Failed to send SMS:', err.message);
      if (isProduction) {
        throw new Error('Failed to send SMS via Twilio. Please check provider settings.');
      }
      console.warn('[Fallback] Falling back to development mock OTP logger.');
    }
  }

  // 3. MSG91 Provider
  if ((provider === 'msg91' || process.env.MSG91_AUTH_KEY) && process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    try {
      const response = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: process.env.MSG91_AUTH_KEY,
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: formattedPhone.replace('+', ''),
          otp: otp,
        }),
      });
      const data = await response.json();
      console.log(`[MSG91 SMS] Real SMS OTP sent to ${formattedPhone}`, data);
      return { success: true, provider: 'msg91', data };
    } catch (err) {
      console.error('[MSG91 Error] Failed to send SMS:', err.message);
      if (isProduction) {
        throw new Error('Failed to send SMS via MSG91.');
      }
    }
  }

  // 4. Development-Only Console Logger (when no live SMS API key is configured in .env)
  console.log('====================================================');
  console.log(`📱 [BasketBee DEV SMS OTP] Mobile: ${formattedPhone}`);
  console.log(`🔑 Verification Code: ${otp}`);
  console.log(`⏳ Valid for: 5 minutes`);
  console.log('💡 Tip: Set FAST2SMS_API_KEY, TWILIO_ACCOUNT_SID, or MSG91_AUTH_KEY in backend/.env to send real SMS');
  console.log('====================================================');

  return {
    success: true,
    provider: 'dev-mock',
    devOtp: !isProduction ? otp : undefined,
  };
};
