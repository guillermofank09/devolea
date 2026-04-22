import { useState, useCallback } from "react";
import { Joyride, type EventData, ACTIONS, EVENTS, STATUS } from "react-joyride";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";

const STORAGE_KEY = "devolea_onboarding_done";

export function isOnboardingDone(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

function markOnboardingDone() {
  localStorage.setItem(STORAGE_KEY, "1");
}

// Step content helper
function Step({ title, body }: { title: string; body: string }) {
  return (
    <Box sx={{ maxWidth: 280, py: 0.5 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>{body}</Typography>
    </Box>
  );
}

const STEPS = [
  {
    target: "body",
    placement: "center" as const,
    content: (
      <Step
        title="Bienvenido a Devolea 👋"
        body="Vamos a configurar tu club en unos pocos pasos: perfil, canchas, profesores, jugadores y torneos."
      />
    ),
    disableBeacon: true,
  },
  {
    target: "#tour-account-btn",
    placement: "bottom-end" as const,
    content: (
      <Step
        title="Datos del club y precios"
        body="Desde acá accedés a Mi Club (nombre, dirección, logo, horarios) y a Ajustes para configurar los precios por hora."
      />
    ),
    disableBeacon: true,
  },
  {
    target: "#tour-nav-canchas",
    placement: "right" as const,
    content: (
      <Step
        title="Canchas"
        body="Agregá las canchas de tu club: nombre, tipo, deporte y disponibilidad horaria."
      />
    ),
    disableBeacon: true,
  },
  {
    target: "#tour-nav-profesores",
    placement: "right" as const,
    content: (
      <Step
        title="Profesores"
        body="Registrá los profesores, sus tarifas propias y horarios de clases."
      />
    ),
    disableBeacon: true,
  },
  {
    target: "#tour-nav-jugadores",
    placement: "right" as const,
    content: (
      <Step
        title="Jugadores"
        body="Cargá los jugadores del club con su categoría, deporte y datos de contacto."
      />
    ),
    disableBeacon: true,
  },
  {
    target: "#tour-nav-torneos",
    placement: "right" as const,
    content: (
      <Step
        title="Torneos"
        body="Una vez que tengas jugadores podés crear torneos, armar llaves y gestionar los partidos."
      />
    ),
    disableBeacon: true,
  },
  {
    target: "body",
    placement: "center" as const,
    content: (
      <Step
        title="¡Todo listo!"
        body="Ya podés empezar a gestionar tu club. Si necesitás ayuda, revisá cada sección."
      />
    ),
    disableBeacon: true,
  },
];

// Which page to navigate to before showing each step
const STEP_ROUTES: Record<number, string> = {
  2: "/",
  3: "/profesores",
  4: "/players",
  5: "/tournaments",
};

interface Props {
  onDone: () => void;
}

export default function OnboardingTour({ onDone }: Props) {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(true);

  const handleCallback = useCallback(
    (data: EventData) => {
      const { action, index, type, status } = data;

      if (
        status === STATUS.FINISHED ||
        status === STATUS.SKIPPED ||
        action === ACTIONS.CLOSE
      ) {
        markOnboardingDone();
        setRun(false);
        onDone();
        return;
      }

      if (type === EVENTS.STEP_AFTER) {
        const next = index + (action === ACTIONS.PREV ? -1 : 1);
        const route = STEP_ROUTES[next];
        if (route) navigate(route);
        setStepIndex(next);
      }
    },
    [navigate, onDone],
  );

  return (
    <Joyride
      steps={STEPS}
      run={run}
      stepIndex={stepIndex}
      continuous
      onEvent={handleCallback}
      locale={{
        back: "Anterior",
        close: "Cerrar",
        last: "Finalizar",
        next: "Siguiente",
        skip: "Saltar tour",
      }}
      options={{
        primaryColor: "#F5AD27",
        textColor: "#111",
        zIndex: 10000,
        showProgress: true,
        buttons: ["back", "close", "primary", "skip"],
        overlayClickAction: false,
        skipScroll: true,
      }}
      styles={{
        tooltip: {
          borderRadius: 12,
          padding: "16px 20px",
        },
        buttonPrimary: {
          borderRadius: 8,
          fontWeight: 700,
          fontSize: "0.8rem",
        },
        buttonBack: {
          color: "#666",
          fontWeight: 600,
          fontSize: "0.8rem",
        },
        buttonSkip: {
          color: "#999",
          fontSize: "0.75rem",
        },
      }}
    />
  );
}
