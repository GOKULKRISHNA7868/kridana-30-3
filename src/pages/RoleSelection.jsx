// src/pages/RoleSelection.js
import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RoleSelection() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState(null);

  const toggleRole = (role) => {
    setActiveRole(activeRole === role ? null : role);
  };

  const roles = [
    {
      id: "user",
      title: "Create a Customer Account",
      points: [
        "View available training sessions, book slots, and track schedule updates.",
        "Purchase gym merchandise, supplements, and training equipment conveniently.",
        "Access instructional and workout videos for guided training anytime.",
        "Connect with trainers for personalized guidance, feedback, and improvement tips.",
      ],
    },
    {
      id: "trainer",
      title: "Create a Trainer Profile",
      points: [
        "Manage member details, progress, and communication.",
        "Update and maintain trainer profiles with achievements and specialties.",
        "Track member attendance and manage payment records effortlessly.",
        "Promote services, merchandise, and partner offers within the app.",
      ],
    },
    {
      id: "institute",
      title: "Onboard Your Institute",
      points: [
        "Manage member details, progress, and communication.",
        "Update and maintain trainer profiles with achievements and specialties.",
        "Track member attendance and manage payment records effortlessly.",
        "Promote services, merchandise, and partner offers within the app.",
      ],
    },
  ];
  const getSignupPath = (role) => {
    switch (role) {
      case "user":
        return "/signup";
      case "trainer":
        return "/trainer-signup";
      case "institute":
        return "/institute-signup";
      default:
        return "/signup";
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-3 sm:px-6 md:px-10 lg:px-16">
      <div className="bg-white w-full max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-4xl rounded-lg p-4 sm:p-6 md:p-8 lg:p-10 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-500 mb-2 sm:mb-3">
          Create Your Account
        </h1>

        <p className="text-gray-700 mb-8">
          Get access to opportunities, institutes, and certified trainers in one
          location.
        </p>

        <div className="bg-[#E7B89E] p-6 rounded-lg space-y-5">
          {roles.map((role) => (
            <div key={role.id}>
              {/* HEADER */}
              <div
                onClick={() => toggleRole(role.id)}
                className={`flex justify-between items-center px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5
border-2 border-orange-500 rounded-lg cursor-pointer
bg-white hover:bg-orange-50 transition-all duration-300`}
              >
                <span className="text-lg font-semibold text-black">
                  {role.title}
                </span>

                {activeRole === role.id ? (
                  <ChevronDown className="text-orange-500" size={26} />
                ) : (
                  <ChevronRight className="text-orange-500" size={26} />
                )}
              </div>

              {/* BODY */}
              <div
                className={`overflow-hidden transition-all duration-500 
                ${activeRole === role.id ? "max-h-[1000px] mt-3" : "max-h-0"}`}
              >
                <div className="border-2 border-orange-500 rounded-lg bg-white text-left px-6 py-5">
                  <ul className="list-disc pl-5 space-y-2 text-black">
                    {role.points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>

                  {/* BUTTONS */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-5">
                    <button
                      onClick={() => navigate(getSignupPath(role.id))}
                      className="bg-orange-500 px-5 py-2 rounded-md text-white font-semibold hover:bg-orange-600"
                    >
                      Sign Up
                    </button>

                    <button
                      onClick={() => navigate(`/login?role=${role.id}`)}
                      className="bg-gray-700 px-5 py-2 rounded-md text-white font-semibold hover:bg-gray-800"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
