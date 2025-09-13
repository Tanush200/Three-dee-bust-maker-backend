const nodeMailer = require('nodemailer');
const crypto = require('crypto')

const createTransporter = () => {
    return nodeMailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
}


const sendVerificationEmail = async(user, verificationToken) => {
    const transporter = createTransporter();

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}&id=${user._id}`;

      const mailOptions = {
        from: `"3D Bust Maker" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Verify Your Email Address",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Welcome to 3D Bust Maker!</h2>
        <p>Hi ${user.username},</p>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007cba; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #007cba;">${verificationUrl}</p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 24 hours. If you didn't create this account, please ignore this email.
        </p>
      </div>
    `,
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Verification email sent: " + info.messageId);
        return true
        
      } catch (error) {
        console.error("Error sending verification email:", error);
        return false
      }
};


const sendPasswordResetEmail = async (user , resetToken) => {
    const transporter = createTransporter();

     const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&id=${user._id}`;

       const mailOptions = {
         from: `"3D Bust Maker" <${process.env.SMTP_USER}>`,
         to: user.email,
         subject: "Reset Your Password",
         html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p>Hi ${user.username},</p>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc3545; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
       };

       try {
         const info = await transporter.sendMail(mailOptions);
         console.log("Password reset email sent: " + info.messageId);
         return true;
       } catch (error) {
         console.error("Error sending password reset email:", error);
         return false;
       }
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
}
