// Resources.tsx: A page for displaying mental health resources and helplines.
import { useState, useEffect } from 'react';
import { getResources } from '../lib/api';

// Define a type for a single resource item for type safety.
type Resource = {
  name: string;
  contact: string;
  type: string;
  cost: string;
};

// This component fetches and displays a list of mental health resources.
const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // This effect runs once on component mount to fetch data.
  // It's an inline arrow function as requested.
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await getResources();
        setResources(data);
      } catch (error) {
        console.error("Failed to fetch resources:", error);
        // You could set an error state here to show a message to the user
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []); // Empty dependency array means this runs only once.

  if (loading) {
    return <div className="text-center p-8">Loading resources...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Help & Resources</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((resource, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold">{resource.name}</h2>
            <p className="text-gray-600 capitalize">{resource.type} ({resource.cost})</p>
            <a href={resource.contact} className="text-blue-600 hover:underline">
              {resource.contact.startsWith('tel:') ? `Call: ${resource.contact.substring(4)}` : `Contact: ${resource.contact}`}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Resources;
