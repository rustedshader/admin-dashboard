'use client';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  department: z.string().min(1, "Please select a department"),
  uniqueId: z.string().min(1, "Unique ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  department: z.string().min(1, "Please select a department"),
  uniqueId: z.string().min(1, "Unique ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  fullName: z.string().min(2, "Full name is required"),
  designation: z.string().min(1, "Designation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const departments = [
  "Government of India",
  "Andhra Pradesh Government",
  "Arunachal Pradesh Government", 
  "Assam Government",
  "Bihar Government",
  "Chhattisgarh Government",
  "Goa Government",
  "Gujarat Government",
  "Haryana Government",
  "Himachal Pradesh Government",
  "Jharkhand Government",
  "Karnataka Government",
  "Kerala Government",
  "Madhya Pradesh Government",
  "Maharashtra Government",
  "Manipur Government",
  "Meghalaya Government",
  "Mizoram Government",
  "Nagaland Government",
  "Odisha Government",
  "Punjab Government",
  "Rajasthan Government",
  "Sikkim Government",
  "Tamil Nadu Government",
  "Telangana Government",
  "Tripura Government",
  "Uttar Pradesh Government",
  "Uttarakhand Government",
  "West Bengal Government",
  "Delhi Police",
  "Mumbai Police",
  "Kolkata Police",
  "Chennai Police",
  "Bangalore Police",
  "Hyderabad Police",
  "Central Bureau of Investigation (CBI)",
  "Intelligence Bureau (IB)",
  "Research and Analysis Wing (RAW)",
];

const Login = () => {
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      department: "",
      uniqueId: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      department: "",
      uniqueId: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      designation: "",
    },
  });

  const onLoginSubmit = (data: LoginForm) => {
    console.log("Login data:", data);
    // Handle login logic here
  };

  const onSignupSubmit = (data: SignupForm) => {
    console.log("Signup data:", data);
    // Handle signup logic here
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#2A777C" }}>
      <Card className="w-full max-w-4xl overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Image */}
          <div className="md:w-1/2 bg-gradient-to-br from-orange-100 to-green-100 p-8 flex items-center justify-center">
            <div className="text-center">
              <Image 
                src={'/government-building.jpg'} 
                alt="Government of India" 
                width={384}
                height={216}
                className="w-full max-w-sm mx-auto rounded-lg shadow-lg mb-6"
              />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Government of India
              </h2>
              <p className="text-gray-600">
                Secure Portal for Government Officials and Law Enforcement
              </p>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="md:w-1/2 p-8">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Official Portal</h1>
                <p className="text-gray-600 mt-2">Access your government account</p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-48">
                                {departments.map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="uniqueId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unique ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your unique ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full bg-[#2A777C] hover:bg-[#236368] text-white">
                        Login
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                      <FormField
                        control={signupForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-48">
                                {departments.map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="designation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Designation</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your designation" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="uniqueId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unique ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your unique ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full bg-[#2A777C] hover:bg-[#236368] text-white">
                        Sign Up
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;