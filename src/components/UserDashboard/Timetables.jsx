import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function StudentTimetable() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const studentId = user.uid;

      try {
        /* 🔥 STEP 1: Get student document to find instituteId */
        const studentSnap = await getDocs(collection(db, "students"));

        let instituteId = "";

        studentSnap.forEach((doc) => {
          if (doc.id === studentId) {
            instituteId = doc.data().instituteId;
          }
        });

        if (!instituteId) {
          setLoading(false);
          return;
        }

        /* 🔥 STEP 2: Fetch timetable */
        const timetableSnap = await getDocs(
          collection(db, "institutes", instituteId, "timetable"),
        );

        /* 🔥 STEP 3: Filter only this student's classes */
        const filtered = timetableSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) => item.students?.includes(studentId));

        /* 🔥 STEP 4: Format events */
        const formatted = filtered.map((s) => ({
          id: s.id,
          title: `${s.title} • ${s.trainerName}`,
          start: s.start?.toDate ? s.start.toDate() : s.start,
          end: s.end?.toDate ? s.end.toDate() : s.end,
          extendedProps: {
            session: s.session,
          },
        }));

        setEvents(formatted);
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-lg">
        Loading timetable...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg min-h-screen">
      <h2 className="text-xl font-bold mb-4 text-center">
        📅 My Class Timetable
      </h2>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridDay,timeGridWeek,dayGridMonth,listWeek",
        }}
        height="auto"
        events={events}
        allDaySlot={false}
        eventClick={(info) => {
          const { session } = info.event.extendedProps;

          alert(
            `Class: ${info.event.title}
Session: ${session}
Start: ${info.event.start.toLocaleString()}
End: ${info.event.end.toLocaleString()}`,
          );
        }}
      />
    </div>
  );
}
