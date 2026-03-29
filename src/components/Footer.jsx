import React from "react";
import { FaLinkedinIn } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = ({ darkMode }) => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer
      className="w-full py-14"
      style={{
        background:
          "linear-gradient(90deg,#FFE2B8 0%,#FFF1DB 50%,#FFD199 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* TOP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-start">
          {/* COMPANY (LEFT) */}
          <div className="flex flex-col gap-3 text-left">
            <h3 className="text-xl font-semibold text-[#DB6A2E]">Company</h3>

            <Link
              to="/about"
              onClick={scrollToTop}
              className="hover:text-[#DB6A2E] text-[#5D3A09]"
            >
              About Us
            </Link>

            <Link
              to="/career"
              onClick={scrollToTop}
              className="hover:text-[#DB6A2E] text-[#5D3A09]"
            >
              Careers
            </Link>
          </div>

          {/* NEED HELP (CENTER) */}
          <div className="flex flex-col items-center gap-3 text-center">
            <h3 className="text-xl font-semibold text-[#DB6A2E]">Need Help?</h3>

            <Link
              to="/help-center"
              onClick={scrollToTop}
              className="hover:text-[#DB6A2E] text-[#5D3A09]"
            >
              Visit Help Centre
            </Link>

            <Link
              to="/feedback"
              onClick={scrollToTop}
              className="hover:text-[#DB6A2E] text-[#5D3A09]"
            >
              Share Feedback
            </Link>
          </div>

          {/* CONNECT WITH US (RIGHT) */}
          <div className="flex flex-col items-center md:items-center ml-auto gap-4">
            <h3 className="text-xl font-semibold text-[#DB6A2E]">
              Connect with Us
            </h3>

            <a
              href="https://www.linkedin.com/company/kridana-sports-software/"
              target="_blank"
              rel="noopener noreferrer"
              className="
                w-14 h-14
                flex items-center justify-center
                rounded-full
                border-2 border-[#DB6A2E]
                text-[#DB6A2E]
                hover:bg-[#DB6A2E]
                hover:text-white
                transition-all duration-300
              "
            >
              <FaLinkedinIn size={22} />
            </a>
          </div>
        </div>

        {/* COPYRIGHT */}

        <div className="mt-14 border-t border-[#DB6A2E]/30 pt-6">
          <div className="flex justify-center items-center gap-6 text-[#5D3A09] flex-wrap text-center">
            <span>
              © {new Date().getFullYear()} Kridana. All rights reserved. Kridana
              is a product of Kdastsho Fintech Solutions Pvt. Ltd., India
            </span>

            <Link
              to="/terms"
              onClick={scrollToTop}
              className="hover:text-[#DB6A2E]"
            >
              Terms & Conditions
            </Link>

            <Link
              to="/privacy"
              onClick={scrollToTop}
              className="hover:text-[#DB6A2E]"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
