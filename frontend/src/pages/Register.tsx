import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { validateRegister } from '../utils/validation';
import { Compass, Mail, Lock, User, Phone, MapPin, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const { showToast } = useUIStore();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    country: '',
  });

  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldError) setFieldError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateRegister({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    });
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    setFieldError(null);

    const success = await register({
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      password: formData.password,
      phone_number: formData.phone || undefined,
      city: formData.city || undefined,
      country: formData.country || undefined,
    });

    if (success) {
      showToast('success', 'Registration successful! Welcome to GlobeTrotter.');
      navigate('/');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-brand-50/50 via-slate-50 to-slate-100">
      <div className="max-w-xl w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-card border border-slate-100 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Compass className="h-8 w-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create your Explorer Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Join thousands of travelers planning unforgettable journeys
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              required
              leftIcon={<User className="h-4 w-4" />}
              value={formData.firstName}
              onChange={handleChange}
            />
            <Input
              label="Last Name"
              name="lastName"
              required
              leftIcon={<User className="h-4 w-4" />}
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              name="email"
              required
              leftIcon={<Mail className="h-4 w-4" />}
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              leftIcon={<Phone className="h-4 w-4" />}
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              name="city"
              leftIcon={<MapPin className="h-4 w-4" />}
              value={formData.city}
              onChange={handleChange}
            />
            <Input
              label="Country"
              name="country"
              leftIcon={<MapPin className="h-4 w-4" />}
              value={formData.country}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Password"
            type="password"
            name="password"
            required
            leftIcon={<Lock className="h-4 w-4" />}
            value={formData.password}
            onChange={handleChange}
            hint="At least 8 characters"
            error={
              fieldError && (fieldError.includes('Password') || fieldError.includes('password'))
                ? fieldError
                : undefined
            }
          />

          {fieldError &&
            !fieldError.includes('Password') &&
            !fieldError.includes('password') &&
            !fieldError.includes('name') &&
            !fieldError.includes('Email') && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {fieldError}
              </div>
            )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full shadow-md shadow-brand-500/25"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Register Account
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

