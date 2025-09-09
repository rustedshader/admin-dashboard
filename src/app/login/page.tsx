"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Login failed. Please check your credentials.");
      }

      if (result?.ok) {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#2A777C" }}
    >
      <Card className="w-full max-w-4xl overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Image */}
          <div className="md:w-1/2 bg-gradient-to-br from-orange-100 to-green-100 p-8 flex items-center justify-center">
            <div className="text-center">
              <Image
                src={"/government-building.jpg"}
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

          {/* Right side - Login Form */}
          <div className="md:w-1/2 p-8">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Portal
                </h1>
                <p className="text-gray-600 mt-2">
                  Access your admin dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Username
                    </label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter your username"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="w-full"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#2A777C] hover:bg-[#236368] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Admin access only. Contact system administrator for access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
