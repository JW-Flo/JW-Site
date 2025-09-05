import React, { useState } from 'react';

const DemoPricing = () => {
  const [selectedTier, setSelectedTier] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', company: '' });

  const tiers = [
    {
      name: 'Starter',
      price: '$6',
      users: '10 users',
      features: ['SSO & MFA', 'Directory', '5 Integrations', 'Community Support']
    },
    {
      name: 'Essentials',
      price: '$12',
      users: '300 users',
      features: ['All Starter +', 'Advanced Automation', 'Compliance', 'Email Support']
    },
    {
      name: 'Professional',
      price: '$18',
      users: 'Unlimited',
      features: ['All Essentials +', 'Advanced Security', 'Analytics', 'Premium Support']
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      users: 'Unlimited',
      features: ['All Professional +', 'API Access', 'Governance', 'Dedicated Support']
    }
  ];

  const features = [
    { name: 'SSO & MFA', starter: true, essentials: true, professional: true, enterprise: true },
    { name: 'Directory', starter: true, essentials: true, professional: true, enterprise: true },
    { name: 'Integrations', starter: '5', essentials: '50', professional: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'Workflows', starter: '5', essentials: '50', professional: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'Compliance', starter: false, essentials: true, professional: true, enterprise: true },
    { name: 'Analytics', starter: false, essentials: false, professional: true, enterprise: true },
    { name: 'API Access', starter: false, essentials: false, professional: false, enterprise: true },
    { name: 'Dedicated Support', starter: false, essentials: false, professional: false, enterprise: true }
  ];

  const handleSelectTier = (tier) => {
    setSelectedTier(tier);
    setShowSignup(true);
  };

  const handleSignup = (e) => {
    e.preventDefault();
    alert(`Thank you for signing up for ${selectedTier.name}! We'll be in touch soon.`);
    setShowSignup(false);
    setFormData({ name: '', email: '', company: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AtlasIT Pricing</h1>
          <p className="text-xl text-gray-600">Choose the perfect plan for your identity and workflow needs</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {tiers.map((tier) => (
            <div key={tier.name} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">{tier.price}<span className="text-sm font-normal">/user/mo</span></div>
              <p className="text-gray-600 mb-4">{tier.users}</p>
              <ul className="mb-6 space-y-2">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelectTier(tier)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Start Trial
              </button>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <h2 className="text-2xl font-bold text-gray-900 p-6 bg-gray-50">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Starter</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Essentials</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Professional</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Enterprise</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {features.map((feature, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{feature.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {feature.starter === true ? '✓' : feature.starter === false ? '✗' : feature.starter}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {feature.essentials === true ? '✓' : feature.essentials === false ? '✗' : feature.essentials}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {feature.professional === true ? '✓' : feature.professional === false ? '✗' : feature.professional}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {feature.enterprise === true ? '✓' : feature.enterprise === false ? '✗' : feature.enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signup Modal */}
        {showSignup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign Up for {selectedTier?.name}</h2>
              <form onSubmit={handleSignup}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignup(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoPricing;
