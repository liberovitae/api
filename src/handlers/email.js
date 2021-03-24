import nodemailer from 'nodemailer';
import Email from 'email-templates';
import { config } from 'dotenv';

const env = process.env.NODE_ENV;
config({ path: `./.env.${env}` });

export const createEmail = async () => {
  try {
    let testAccount = await nodemailer.createTestAccount();

    let SMTP_HOST;
    let SMTP_USERNAME;
    let SMTP_PASSWORD;

    if (process.env.NODE_ENV === 'development') {
      SMTP_HOST = 'smtp.ethereal.email';
      SMTP_USERNAME = testAccount.user;
      SMTP_PASSWORD = testAccount.pass;
    }

    if (process.env.NODE_ENV === 'production') {
      SMTP_HOST = process.env.SMTP_HOST;
      SMTP_USERNAME = process.env.SMTP_USERNAME;
      SMTP_PASSWORD = process.env.SMTP_PASSWORD;
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: SMTP_USERNAME,
        pass: SMTP_PASSWORD,
      },
    });

    return new Email({
      transport: transporter,
      send: true,
      preview: process.env.NODE_ENV === 'development' ? true : false,
    });
  } catch (err) {
    console.log(err);
  }
};

export const VerifyEmail = async ({ userEmail, token }) => {
  try {
    const email = await createEmail();
    return await email.send({
      template: 'verifyemail',
      message: {
        from: `${process.env.SITE_NAME} <no-reply@liberovitae.com>`,
        to: userEmail,
      },
      locals: {
        sitename: process.env.SITE_NAME,
        hostname: process.env.HOSTNAME,
        token: token,
      },
    });
  } catch (err) {
    console.log(err);
  }
};

export const ChangeEmail = async ({ userEmail, token }) => {
  try {
    const email = await createEmail();
    return await email.send({
      template: 'changeemail',
      message: {
        from: `${process.env.SITE_NAME} <no-reply@liberovitae.com>`,
        to: userEmail,
      },
      locals: {
        sitename: process.env.SITE_NAME,
        hostname: process.env.HOSTNAME,
        token: token,
      },
    });
  } catch (err) {
    console.log(err);
  }
};

export const ResetPassword = async ({ userEmail, token }) => {
  try {
    const email = await createEmail();
    return await email.send({
      template: 'resetpassword',
      message: {
        from: `${process.env.SITE_NAME} <no-reply@liberovitae.com>`,
        to: userEmail,
      },
      locals: {
        sitename: process.env.SITE_NAME,
        hostname: process.env.HOSTNAME,
        token: token,
      },
    });
  } catch (err) {
    console.log(err);
  }
};
