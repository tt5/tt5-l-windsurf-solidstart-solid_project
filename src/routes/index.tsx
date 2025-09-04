import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";

export default function Home() {
  return (
    <div class="max-w-4xl mx-auto">
      <Title>Welcome to Your App</Title>
      <div class="text-center py-12">
        <h1 class="text-4xl font-bold text-gray-900 mb-6">Welcome to Your App</h1>
        <p class="text-xl text-gray-600 mb-8">
          A powerful application to manage your data and more.
        </p>
        <div class="flex justify-center space-x-4">
          <A 
            href="/register" 
            class="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Get Started
          </A>
          <A 
            href="/login" 
            class="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign In
          </A>
        </div>
      </div>
      
      <div class="mt-16 grid md:grid-cols-3 gap-8">
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-3">Easy to Use</h2>
          <p class="text-gray-600">
            Our intuitive interface makes it simple to get started and manage your data.
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-3">Secure</h2>
          <p class="text-gray-600">
            Your data is protected with industry-standard security measures.
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-3">Always Available</h2>
          <p class="text-gray-600">
            Access your data anytime, anywhere with our reliable cloud service.
          </p>
        </div>
      </div>
    </div>
  );
}
