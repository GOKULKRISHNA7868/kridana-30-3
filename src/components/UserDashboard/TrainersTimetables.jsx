import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function StudentTimetable() {
  const [studentId, setStudentId] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState(null);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setStudentId(user.uid);
    });
    return () => unsub();
  }, []);

  /* ---------------- LOAD TIMETABLE ---------------- */
  useEffect(() => {
    if (!studentId) return;

    const loadTimetable = async () => {
      setLoading(true);

      try {
        let allEvents = [];

        const trainerSnap = await getDocs(collection(db, "trainers"));

        const promises = trainerSnap.docs.map((trainerDoc) => {
          const trainerId = trainerDoc.id;

          return getDocs(
            collection(db, "trainers", trainerId, "timetable"),
          ).then((snap) =>
            snap.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            })),
          );
        });

        const results = await Promise.all(promises);

        results.flat().forEach((data) => {
          const isMatched =
            data.students?.some(
              (id) => id === studentId || id.startsWith(studentId),
            ) || false;

          if (isMatched) {
            allEvents.push(data);
          }
        });

        const formatted = allEvents
          .map((s) => {
            const start = s.start?.toDate ? s.start.toDate() : null;
            const end = s.end?.toDate ? s.end.toDate() : null;

            if (!start || !end) return null; // skip invalid

            return {
              id: s.id,
              title: `${s.title} • ${s.trainerName}`,
              start,
              end,
              fullData: {
                ...s,
                start,
                end,
              },
            };
          })
          .filter(Boolean);

        setEvents(formatted);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTimetable();
  }, [studentId]);

  /* ---------------- FORMAT TIME ---------------- */
  const formatTime = (date) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };
  const formatDate = (date) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };
  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600 mb-3"></div>
        Loading timetable...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg min-h-screen">
      {/* HEADER */}
      <h2 className="text-xl font-semibold mb-3 text-center">
        📅 My Class Schedule
      </h2>

      {/* CALENDAR */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridDay,timeGridWeek,dayGridMonth,listYear",
        }}
        allDaySlot={false}
        height="auto"
        events={events}
        eventClick={(info) => {
          setSelectedEvent(info.event.extendedProps.fullData);
        }}
      />

      {/* EMPTY STATE */}
      {events.length === 0 && (
        <div className="text-center text-gray-400 mt-6">
          No classes scheduled yet
        </div>
      )}

      {/* ---------- MODAL ---------- */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-3">
          {/* ---------- MODAL ---------- */}
          {selectedEvent && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-3">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-xl space-y-4">
                <h3 className="text-xl font-semibold text-center">
                  📘 Class Details
                </h3>

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">📌 Category:</span>{" "}
                    {selectedEvent.category}
                  </p>

                  <p>
                    <span className="font-semibold">🎯 SubCategory:</span>{" "}
                    {selectedEvent.subCategory}
                  </p>

                  <p>
                    <span className="font-semibold">👨‍🏫 Trainer:</span>{" "}
                    {selectedEvent.trainerName}
                  </p>

                  <p>
                    <span className="font-semibold">📅 Date:</span>{" "}
                    {formatDate(selectedEvent.start)}
                  </p>

                  <p>
                    <span className="font-semibold">🕒 Time:</span>{" "}
                    {formatTime(selectedEvent.start)} -{" "}
                    {formatTime(selectedEvent.end)}
                  </p>

                  <p>
                    <span className="font-semibold">👥 Students:</span>{" "}
                    {selectedEvent.students?.length || 0}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full bg-gray-200 dark:bg-gray-700 py-2 rounded-lg mt-3"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
