"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { Eye, EyeOff, MessageSquare, Loader2, Check, X } from "lucide-react";

const schema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(32, "Max 32 characters")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Letters, numbers, _  .  - only"),
  email: z.string().email("Invalid email"),
  displayName: z.string().min(1, "Required").max(64, "Max 64 chars"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "One uppercase letter")
    .regex(/[0-9]/, "One number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

const PasswordRule = ({ ok, label }: { ok: boolean; label: string }) => (
  <div className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-400" : "text-surface-500"}`}>
    {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
    {label}
  </div>
);

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [password, setPassword] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await axios.post("/api/auth/register", data);
      setDone(true);
      toast.success("Account created! Check your email.");
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : "Something went wrong";
      toast.error(message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
        <div className="card-base p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Check your email</h2>
          <p className="text-surface-400 text-sm mb-6">
            We sent a verification link to your email. Click it to activate your account.
          </p>
          <Link href="/login" className="btn-primary block text-center">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 grid-pattern pointer-events-none" />
      <div className="absolute inset-0 hero-glow pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">Nex<span className="gradient-text">Talk</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-surface-100">Create your account</h1>
          <p className="text-surface-400 text-sm mt-1">Join thousands already using NexTalk</p>
        </div>

        <div className="card-base p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-surface-300 mb-1.5 block">Username</label>
                <input
                  {...register("username")}
                  type="text"
                  placeholder="johndoe"
                  className="input-base"
                  autoComplete="username"
                />
                {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
              </div>
              <div>
                <label className="text-sm text-surface-300 mb-1.5 block">Display Name</label>
                <input
                  {...register("displayName")}
                  type="text"
                  placeholder="John Doe"
                  className="input-base"
                />
                {errors.displayName && <p className="text-red-400 text-xs mt-1">{errors.displayName.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm text-surface-300 mb-1.5 block">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="input-base"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm text-surface-300 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="input-base pr-10"
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex gap-4 mt-2 flex-wrap">
                  <PasswordRule ok={password.length >= 8} label="8+ chars" />
                  <PasswordRule ok={/[A-Z]/.test(password)} label="Uppercase" />
                  <PasswordRule ok={/[0-9]/.test(password)} label="Number" />
                </div>
              )}
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="text-sm text-surface-300 mb-1.5 block">Confirm Password</label>
              <input
                {...register("confirmPassword")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="input-base"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <p className="text-surface-500 text-xs">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-brand-400 hover:underline">Terms of Service</a> and{" "}
              <a href="#" className="text-brand-400 hover:underline">Privacy Policy</a>.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-surface-400 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
