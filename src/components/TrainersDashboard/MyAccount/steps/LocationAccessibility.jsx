import React, { useEffect, useState } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";

const LocationAccessibility = ({ setStep }) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false); // 🔥 new

  const [formData, setFormData] = useState({
    fullAddress: "",
    landmark: "",
    distance: "",
    phoneNumber: "",
    email: "",
    website: "",

    // 🔥 new fields
    latitude: "",
    longitude: "",
  });

  const [errors, setErrors] = useState({});

  // ================= LOAD DATA =================
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "trainers", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setFormData({
            fullAddress:
              data?.locationAccessibility?.fullAddress ||
              data?.locationName ||
              "",
            landmark: data?.locationAccessibility?.landmark || "",
            distance: data?.locationAccessibility?.distance || "",
            phoneNumber: data?.phoneNumber || "",
            email: data?.email || "",
            website: data?.locationAccessibility?.website || "",

            // 🔥 load geo
            latitude: data?.latitude || "",
            longitude: data?.longitude || "",
          });
        }
      } catch (error) {
        console.error("Error loading trainer location data:", error);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // ================= GEO LOCATION =================
  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toString();
        const lng = position.coords.longitude.toString();

        try {
          // Reverse geocoding
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          );
          const data = await res.json();

          const address = data?.display_name || "";

          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            fullAddress: address, // 🔥 auto fill
          }));
        } catch (err) {
          console.error("Reverse geocoding error:", err);
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to fetch location");
        setGeoLoading(false);
      },
    );
  };

  // ================= VALIDATION =================
  const validate = () => {
    let newErrors = {};

    const requiredFields = [
      "fullAddress",
      "landmark",
      "distance",
      "phoneNumber",
      "email",
    ];

    requiredFields.forEach((field) => {
      const value = formData[field];
      if (!value || String(value).trim() === "") {
        newErrors[field] = "This field is required";
      }
    });

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Enter valid email address";
      }
    }

    if (formData.phoneNumber) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        newErrors.phoneNumber = "Enter valid 10 digit number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= SAVE =================
  const handleSave = async () => {
    if (!user?.uid) {
      alert("User not logged in");
      return;
    }

    const isValid = validate();
    if (!isValid) {
      alert("Please fill all required details correctly.");
      return;
    }

    try {
      setSaving(true);

      const docRef = doc(db, "trainers", user.uid);

      await setDoc(
        docRef,
        {
          phoneNumber: formData.phoneNumber,
          email: formData.email,

          // 🔥 required fields exactly as you asked
          latitude: formData.latitude, // "17.48930115508228"
          longitude: formData.longitude, // "78.3985042909833"
          locationName: formData.fullAddress, // same as address string

          locationAccessibility: {
            fullAddress: formData.fullAddress,
            landmark: formData.landmark,
            distance: formData.distance,
            website: formData.website,
          },

          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      alert("Saved Successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving data");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  const handleCancel = () => {
    setFormData({
      fullAddress: "",
      landmark: "",
      distance: "",
      phoneNumber: "",
      email: "",
      website: "",
      latitude: "",
      longitude: "",
    });

    setErrors({});
  };

  const inputClass = (field) =>
    `border ${errors[field] ? "border-red-500" : "border-gray-300"
    } rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500`;

  return (
    <div className="w-full">
      {/* BACK */}
      <div
        onClick={() => setStep(1)}
        className="flex items-center gap-2 text-orange-600 font-medium mb-4 cursor-pointer"
      >
        ← Back
      </div>

      <div className="border-b border-gray-300 mb-6"></div>

      {/* TITLE */}
      <h2 className="text-orange-500 font-semibold text-lg sm:text-xl mb-6">
        Location & Accessibility
      </h2>

      {/* 🔥 GEO BUTTON (UI minimal, no layout change) */}
      <div className="mb-4">
        <button
          type="button"
          onClick={fetchCurrentLocation}
          className="text-sm text-orange-600 font-medium"
        >
          {geoLoading ? "Fetching location..." : "Use Current Location"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Full Address */}
        <div className="flex flex-col sm:col-span-2">
          <label className="text-sm font-medium mb-2">
            Full Address <span className="text-red-500">*</span>
          </label>
          <textarea
            name="fullAddress"
            value={formData.fullAddress}
            onChange={handleChange}
            rows={4}
            className={`${inputClass("fullAddress")} resize-none`}
          />
          {errors.fullAddress && (
            <span className="text-red-500 text-sm mt-1">
              {errors.fullAddress}
            </span>
          )}
        </div>

        {[
          { label: "Land Mark", name: "landmark" },
          { label: "Distance From User (Auto)", name: "distance" },
          { label: "Contact Number", name: "phoneNumber" },
          { label: "E-mail Address", name: "email" },
        ].map((field) => (
          <div className="flex flex-col" key={field.name}>
            <label className="text-sm font-medium mb-2">
              {field.label} <span className="text-red-500">*</span>
            </label>
            <input
              name={field.name}
              value={formData[field.name]}
              maxLength={field.name === "phoneNumber" ? 10 : undefined}
              onChange={(e) => {
                let value = e.target.value;

                if (field.name === "phoneNumber") {
                  value = value.replace(/\D/g, ""); // allow only numbers
                }

                setFormData((prev) => ({
                  ...prev,
                  [field.name]: value,
                }));

                setErrors((prev) => ({
                  ...prev,
                  [field.name]: "",
                }));
              }}
              className={inputClass(field.name)}
            />
            {errors[field.name] && (
              <span className="text-red-500 text-sm mt-1">
                {errors[field.name]}
              </span>
            )}
          </div>
        ))}
        {/* Latitude */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">Latitude</label>
          <input
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            className={inputClass("latitude")}
            placeholder="17.48930115508228"
          />
        </div>

        {/* Longitude */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">Longitude</label>
          <input
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            className={inputClass("longitude")}
            placeholder="78.3985042909833"
          />
        </div>
        {/* Website */}
        <div className="flex flex-col sm:col-span-2">
          <label className="text-sm font-medium mb-2">
            Website / Social Media Links
          </label>
          <input
            name="website"
            value={formData.website}
            onChange={handleChange}
            className={inputClass("website")}
          />
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
        <button
          onClick={handleCancel}
          className="text-orange-600 font-medium hover:text-black transition"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default LocationAccessibility;