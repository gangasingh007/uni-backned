import z from "zod"

export const createResourceSchema = z.object({
    title : z.string().min(1,"Title is required"),
    link : z.string().min(1,"Link is required")
})

export const updateResourceSchema = z.object({
    title : z.string().min(1,"Title is required").optional(),
    link : z.string().min(1,"Link is required").optional()
})