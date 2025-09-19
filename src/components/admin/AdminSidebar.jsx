import React from 'react';
import { Home, Users, DollarSign, Handshake, Settings, Clock, Bell } from 'lucide-react';

const SidebarBtn = ({ icon: Icon, label, section, activeSection, setActiveSection }) => (
  <button
    onClick={() => setActiveSection(section)}
    className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition-all duration-200 ${activeSection === section
      ? "bg-fern_green-300 text-white shadow-md"
      : "text-fern_green-400 hover:bg-celadon-600 hover:text-fern_green-500"
      }`}
  >
    <Icon className={`inline w-5 h-5 mr-3 ${activeSection === section ? "text-white" : ""}`} />
    <span className="font-medium">{label}</span>
  </button>
);

const AdminSidebar = ({ activeSection, setActiveSection }) => (
  <aside className="w-[20%] bg-gradient-to-b from-fern_green-800 to-fern_green-500 shadow-lg p-6 fixed top-[10vh] left-0 bottom-0 border-r border-celadon-600">
    <h2 className="text-lg font-semibold text-fern_green-500 mb-6">Admin Navigation</h2>
    <nav className="space-y-3 text-md">
      <SidebarBtn icon={Home} label="Overview" section="overview" activeSection={activeSection} setActiveSection={setActiveSection} />
      <SidebarBtn icon={Users} label="Users" section="users" activeSection={activeSection} setActiveSection={setActiveSection} />
      <SidebarBtn icon={DollarSign} label="Loans" section="loans" activeSection={activeSection} setActiveSection={setActiveSection} />
      <SidebarBtn icon={Handshake} label="Relationships" section="relationships" activeSection={activeSection} setActiveSection={setActiveSection} />
      <SidebarBtn icon={Settings} label="Lender Terms" section="lender-terms" activeSection={activeSection} setActiveSection={setActiveSection} />
      <SidebarBtn icon={Clock} label="Payments" section="payments" activeSection={activeSection} setActiveSection={setActiveSection} />
      <SidebarBtn icon={Bell} label="Notifications" section="notifications" activeSection={activeSection} setActiveSection={setActiveSection} />
      <SidebarBtn icon={Clock} label="Audit Logs" section="audit-logs" activeSection={activeSection} setActiveSection={setActiveSection} />
    </nav>
  </aside>
);

export default AdminSidebar;