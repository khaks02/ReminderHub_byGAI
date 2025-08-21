
import React from 'react';
import { User, Mail, Phone, MapPin } from 'lucide-react';

const ProfileInput = ({ icon, label, value, type = "text" }: { icon: React.ReactNode; label: string; value: string; type?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">{label}</label>
        <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {icon}
            </div>
            <input 
                type={type} 
                className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md bg-slate-100 dark:bg-slate-700 dark:border-slate-600"
                value={value}
                disabled 
            />
        </div>
    </div>
);


const ProfilePage: React.FC = () => {
    return (
        <div className="container mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold mb-2">User Profile</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your personal information and saved addresses.</p>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProfileInput 
                        icon={<User className="h-5 w-5 text-gray-400"/>}
                        label="Full Name"
                        value="Alex Doe"
                    />
                    <ProfileInput 
                        icon={<User className="h-5 w-5 text-gray-400"/>}
                        label="Username"
                        value="alex_doe"
                    />
                     <ProfileInput 
                        icon={<Mail className="h-5 w-5 text-gray-400"/>}
                        label="Email Address"
                        value="alex.doe@example.com"
                        type="email"
                    />
                     <ProfileInput 
                        icon={<Phone className="h-5 w-5 text-gray-400"/>}
                        label="Phone Number"
                        value="+1 (555) 123-4567"
                        type="tel"
                    />
                </div>
                 <div className="mt-6 text-right">
                    <button className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-primary-dark transition-colors">
                        Edit Profile
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Saved Addresses</h2>
                <div className="space-y-4">
                     <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg flex items-start gap-4">
                         <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0"/>
                         <div>
                            <p className="font-bold">Home</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">123 Market St, San Francisco, CA 94103</p>
                         </div>
                     </div>
                      <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg flex items-start gap-4">
                         <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0"/>
                         <div>
                            <p className="font-bold">Work</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">456 Tech Park Ave, Mountain View, CA 94043</p>
                         </div>
                     </div>
                </div>
                 <div className="mt-6 text-right">
                    <button className="bg-slate-200 dark:bg-slate-600 font-bold py-2 px-6 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                        Add New Address
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
