import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@secureqr.com';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>إعادة تعيين كلمة المرور</h2>
      <p>مرحباً،</p>
      <p>لقد طلبت إعادة تعيين كلمة المرور لحسابك في SecureQR.</p>
      <p>يرجى النقر على الرابط التالي لإعادة تعيين كلمة المرور:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">إعادة تعيين كلمة المرور</a>
      <p>إذا لم تقم بطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.</p>
      <p>هذا الرابط صالح لمدة 24 ساعة فقط.</p>
      <p>مع خالص التحية،<br>فريق SecureQR</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'إعادة تعيين كلمة المرور - SecureQR',
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>مرحباً بك في SecureQR!</h2>
      <p>مرحباً ${name}،</p>
      <p>شكراً لك على التسجيل في SecureQR. يمكنك الآن إنشاء رموز QR آمنة ومتقدمة.</p>
      <p>ابدأ بإنشاء رمز QR الأول الخاص بك من لوحة التحكم.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">الذهاب إلى لوحة التحكم</a>
      <p>مع خالص التحية،<br>فريق SecureQR</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'مرحباً بك في SecureQR',
    html,
  });
}

export async function sendTestEmail(email: string): Promise<void> {
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>اختبار البريد الإلكتروني</h2>
      <p>هذا بريد إلكتروني اختباري من SecureQR.</p>
      <p>إذا كنت تتلقى هذا البريد، فإن إعدادات البريد الإلكتروني تعمل بشكل صحيح.</p>
      <p>مع خالص التحية،<br>فريق SecureQR</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'اختبار البريد الإلكتروني - SecureQR',
    html,
  });
}

export async function sendNewPasswordToUser(email: string, newPassword: string): Promise<void> {
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>كلمة مرور جديدة</h2>
      <p>مرحباً،</p>
      <p>تم إنشاء كلمة مرور جديدة لحسابك في SecureQR.</p>
      <p>كلمة المرور الجديدة: <strong>${newPassword}</strong></p>
      <p>يرجى تسجيل الدخول وتغيير كلمة المرور فوراً من إعدادات الحساب.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">تسجيل الدخول</a>
      <p>مع خالص التحية،<br>فريق SecureQR</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'كلمة مرور جديدة - SecureQR',
    html,
  });
}

export async function sendPasswordResetNotificationToAdmin(userName: string, userEmail: string, requestId: string): Promise<boolean> {
  try {
    // Get admin emails - for now, we'll use a hardcoded admin email or get from env
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['admin@secureqr.com'];

    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>طلب إعادة تعيين كلمة مرور</h2>
        <p>مرحباً،</p>
        <p>تم طلب إعادة تعيين كلمة المرور للمستخدم التالي:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
          <p><strong>الاسم:</strong> ${userName}</p>
          <p><strong>البريد الإلكتروني:</strong> ${userEmail}</p>
          <p><strong>تاريخ الطلب:</strong> ${new Date().toLocaleString('ar-SA')}</p>
        </div>
        <p>يرجى مراجعة الطلب في لوحة تحكم المدير.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">مراجعة الطلبات</a>
        <p>مع خالص التحية،<br>نظام SecureQR</p>
      </div>
    `;

    // Send to all admin emails
    const sendPromises = adminEmails.map(adminEmail =>
      sendEmail({
        to: adminEmail,
        subject: `طلب إعادة تعيين كلمة مرور من ${userName} - SecureQR`,
        html,
      }).catch(error => {
        console.error(`Failed to send notification to admin ${adminEmail}:`, error);
        return false;
      })
    );

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(result => result !== false).length;

    if (successCount > 0) {
      console.log(`Password reset notification sent to ${successCount} admin(s)`);
      return true;
    } else {
      console.error('Failed to send password reset notification to any admin');
      return false;
    }
  } catch (error) {
    console.error('Error sending password reset notification to admin:', error);
    return false;
  }
}

export async function testEmailConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { success: true, message: 'تم الاتصال بالخادم بنجاح' };
  } catch (error: any) {
    console.error('Email connection test failed:', error);
    return { success: false, message: `فشل في الاتصال: ${error.message}` };
  }
}
