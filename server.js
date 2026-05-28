require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());

// safer CORS (you can replace with your Netlify domain)
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST"],
    })
);

/* =========================
   ENV CHECK (safe logging)
========================= */
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Missing EMAIL_USER or EMAIL_PASS in .env");
}

/* =========================
   NODEMAILER TRANSPORT
========================= */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // MUST be Gmail App Password
    },
});

/* verify SMTP connection */
transporter.verify((error, success) => {
    if (error) {
        console.log("❌ SMTP ERROR:", error);
    } else {
        console.log("✅ Email server is ready");
    }
});

/* =========================
   VALIDATION FUNCTION
========================= */
function validateInput(data) {
    const { fullName, email, phone } = data;

    if (!fullName || !email || !phone) {
        return false;
    }

    // simple email check
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
        return false;
    }

    return true;
}

/* =========================
   SEND EMAIL ROUTE
========================= */
app.post("/send-email", async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            occupation,
            batch,
            message,
        } = req.body;

        /* validation */
        if (!validateInput(req.body)) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing required fields",
            });
        }

        const mailOptions = {
            from: `"Techway Academy" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "New Enrollment Form Submission",

            html: `
                <div style="font-family: Arial; padding: 10px;">
                    <h2>New Enrollment Received</h2>
                    <hr/>
                    <p><b>Name:</b> ${fullName}</p>
                    <p><b>Email:</b> ${email}</p>
                    <p><b>Phone:</b> ${phone}</p>
                    <p><b>Occupation:</b> ${occupation || "N/A"}</p>
                    <p><b>Batch:</b> ${batch || "N/A"}</p>
                    <p><b>Message:</b> ${message || "N/A"}</p>
                </div>
            `,

            replyTo: email,
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: "Email sent successfully",
        });

    } catch (error) {
        console.error("❌ EMAIL ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Email sending failed",
        });
    }
});

/* =========================
   TEST ROUTE
========================= */
app.get("/", (req, res) => {
    res.send("🚀 Server is running fine");
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});