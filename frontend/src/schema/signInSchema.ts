// Yup schema for the sign-in form (spec S1). Only "is it filled in": the service decides
// whether the details are right.
import * as Yup from 'yup'

export const signInSchema = Yup.object({
  email: Yup.string().trim().required('Enter your email address'),
  password: Yup.string().required('Enter your password'),
})

export type SignInValues = Yup.InferType<typeof signInSchema>
