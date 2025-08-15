import z from "zod";

export const adminRegisterValidator = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    email: z.email("Invalid email format"),
    courseName: z.string(),
    section: z.string(),
    semester: z.string(),
    rollNumber: z.string().min(5, "Roll number must be at least 5 characters long"),
});

export const adminLoginValidator = z.object({
    rollNumber: z.string().min(1, "Roll number is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});