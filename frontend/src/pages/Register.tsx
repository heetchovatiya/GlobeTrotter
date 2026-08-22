import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Compass, Mail, Lock, User, Phone, MapPin, Camera, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const { showToast } = useUIStore();

  const [formData, setFormData] = useState({
    firstName: 'Sara',
    lastName: 'Connor',
    email: 'sara.connor@example.com',
    password: 'securePass123!',
    phone: '+1 (555) 789-0123',
    city: 'Seattle',
    country: 'United States',
    additionalInfo: 'Love hiking in national parks and architectural photography.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register({
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      password: formData.password,
      phone_number: formData.phone,
      city: formData.city,
      country: formData.country,
      additional_info: formData.additionalInfo,
      profile_photo_url: formData.profilePhotoUrl,
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
          {/* Avatar upload placeholder */}
          <div className="flex flex-col items-center justify-center pb-2">
            <div className="relative group cursor-pointer">
              <img
                src={formData.profilePhotoUrl}
                alt="Profile preview"
                className="h-20 w-20 rounded-full object-cover ring-4 ring-brand-100 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="mt-2 text-xs text-slate-400">Profile Photo</span>
          </div>

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
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Additional Information / Travel Style
            </label>
            <textarea
              name="additionalInfo"
              rows={2}
              value={formData.additionalInfo}
              onChange={handleChange}
              placeholder="Tell us about your favorite travel destinations or bucket list..."
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

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

