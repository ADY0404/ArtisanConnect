import { Search, CalendarDays, UserCheck } from 'lucide-react';
import React from 'react';

function HowItWorks() {
  const steps = [
    {
      icon: <Search className="h-10 w-10 text-white" />,
      title: 'Find a Service',
      description: 'Browse through our categories for the specific service you need',
    },
    {
      icon: <CalendarDays className="h-10 w-10 text-white" />,
      title: 'Book an Appointment',
      description: 'Select a convenient date and time for your service appointment',
    },
    {
      icon: <UserCheck className="h-10 w-10 text-white" />,
      title: 'Get it Done',
      description: 'Our verified professional will arrive and complete the service',
    },
  ];

  return (
    <section className="py-16 bg-white sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Getting your home services done is as easy as 1-2-3
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center h-20 w-20 mx-auto bg-primary rounded-full">
                {step.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-base text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks; 