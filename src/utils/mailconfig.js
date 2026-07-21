import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.HOSTINGER_MAIL_USER,
    pass: process.env.HOSTINGER_MAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

transporter.verify(() => {
  console.log("✅ SMTP SERVER READY");
});

export const sendContactMail = async (data) => {
  await transporter.sendMail({
    from: `"Annapurna farms" <${process.env.HOSTINGER_MAIL_USER}>`,
    to: process.env.ADMIN_MAIL,
    subject: "Annapurna farms New Contact Enquiry",
    text: `
        name: ${data.name}
        Phone: ${data.phone_number}
        Email: ${data.email}
        Message: ${data.message}
        `,
  });
};

export const sendOtpMail = async (email, otp) => {
  await transporter.sendMail({
    from: `"Annapurna farms" <${process.env.HOSTINGER_MAIL_USER}>`,
    to: email,
    subject: "OTP Verification",
    html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
          
          <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: #198754; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">Annapurna farms</h1>
              <p style="color: #e6f0ff; margin: 5px 0 0;">Empowering Your Learning Journey</p>
            </div>

            <!-- Body -->
            <div style="padding: 25px; text-align: center;">
              
              <h2 style="color: #333;">Email Verification</h2>
              
              <p style="color: #555; font-size: 14px;">
                Hello,<br><br>
                Thank you for registering with <b>Annapurna farms</b>.  
                Please use the OTP below to verify your email address.
              </p>

              <!-- OTP Box -->
              <div style="margin: 25px 0;">
                <span style="
                  display: inline-block;
                  padding: 15px 25px;
                  font-size: 24px;
                  letter-spacing: 5px;
                  font-weight: bold;
                  color: #198754;
                  border: 2px dashed #198754;
                  border-radius: 8px;
                ">
                  ${otp}
                </span>
              </div>

              <p style="color: #777; font-size: 13px;">
                This OTP is valid for <b>5 minutes</b>.
              </p>

              <p style="color: #999; font-size: 12px; margin-top: 20px;">
                If you did not request this, please ignore this email.
              </p>

            </div>

            <!-- Footer -->
            <div style="background: #f0f0f0; padding: 15px; text-align: center;">
              <p style="font-size: 12px; color: #888; margin: 0;">
                © ${new Date().getFullYear()} Annapurna farms. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      `,
  });
};

export const sendforgotpasswordOtpMail = async (email, otp) => {
  await transporter.sendMail({
    from: `"Smile Blood Bank" <${process.env.HOSTINGER_MAIL_USER}>`,
    to: email,
    subject: "Reset Your Password - Smile Blood Bank OTP",
    html: `
            <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
              
              <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="background: #198754; padding: 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0;">Smile Blood Bank</h1>
                  <p style="color: #e6f0ff; margin: 5px 0 0;">Secure Password Reset</p>
                </div>

                <!-- Body -->
                <div style="padding: 25px; text-align: center;">
                  
                  <h2 style="color: #333;">Forgot Password Request</h2>
                  
                  <p style="color: #555; font-size: 14px;">
                    Hello,<br><br>
                    We received a request to reset your password for your <b>Smile Blood Bank</b> account.
                  </p>

                  <p style="color: #555; font-size: 14px;">
                    Please use the OTP below to proceed with resetting your password:
                  </p>

                  <!-- OTP Box -->
                  <div style="margin: 25px 0;">
                    <span style="
                      display: inline-block;
                      padding: 15px 25px;
                      font-size: 24px;
                      letter-spacing: 5px;
                      font-weight: bold;
                      color: #198754;
                      border: 2px dashed #198754;
                      border-radius: 8px;
                    ">
                      ${otp}
                    </span>
                  </div>

                  <p style="color: #777; font-size: 13px;">
                    This OTP is valid for <b>5 minutes</b>.
                  </p>

                  <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    If you did not request a password reset, please ignore this email or contact support.
                  </p>

                </div>

                <!-- Footer -->
                <div style="background: #f0f0f0; padding: 15px; text-align: center;">
                  <p style="font-size: 12px; color: #888; margin: 0;">
                    © ${new Date().getFullYear()} Smile Blood Bank. All rights reserved.
                  </p>
                </div>

              </div>
            </div>

            `,
  });
};
