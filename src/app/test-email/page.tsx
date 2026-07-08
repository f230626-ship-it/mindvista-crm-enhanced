'use client';

import { useState } from 'react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEmail = async (testEmail: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test-email?email=${encodeURIComponent(testEmail)}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setResult({ error: "Request failed", details: message });
    }
    setLoading(false);
  };

  const testCases = [
    { email: 'omar@gmail.com', expected: 'INVALID' },
    { email: 'test@gmail.com', expected: 'INVALID' },
    { email: 'fake@yahoo.com', expected: 'INVALID' },
    { email: 'dummy@outlook.com', expected: 'VALID' },
    { email: 'support@github.com', expected: 'VALID' },
    { email: 'info@google.com', expected: 'VALID' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Email Validation Test</h1>
        
        {/* Manual Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Manual Test</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email to test..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={() => testEmail(email)}
              disabled={loading || !email}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Email'}
            </button>
          </div>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Automated Test Cases */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Automated Test Cases</h2>
          <div className="space-y-2">
            {testCases.map((testCase, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{testCase.email}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    (Expected: {testCase.expected})
                  </span>
                </div>
                <button
                  onClick={() => testEmail(testCase.email)}
                  disabled={loading}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded disabled:opacity-50"
                >
                  Test
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={async () => {
              for (const testCase of testCases) {
                setEmail(testCase.email);
                await testEmail(testCase.email);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
              }
            }}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50"
          >
            Run All Tests
          </button>
        </div>
      </div>
    </div>
  );
}