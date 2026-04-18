"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import { UserMenu } from "@/components/settings/UserMenu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Doc } from "@/lib/types";

interface Props {
  docs: Doc[];
  currentId: string;
  creating: boolean;
  onCreate: () => void;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Typography
      sx={{
        px: 2,
        pt: 1.5,
        pb: 0.5,
        fontSize: "0.72rem",
        fontWeight: 600,
        color: "text.disabled",
        opacity: 0.7,
      }}
    >
      {label}
    </Typography>
  );
}

function DocItem({ doc, index, active }: { doc: Doc; index: number; active: boolean }) {
  const router = useRouter();
  const isShared = doc.role !== "owner";

  return (
    <Box
      key={doc.id}
      className="lumen-rise"
      onClick={() => router.push(`/docs/${doc.id}`)}
      sx={(theme) => ({
        animationDelay: `${0.18 + index * 0.025}s`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 2,
        py: 1,
        my: 0.25,
        borderRadius: "4px",
        cursor: "pointer",
        transition: "all 0.22s cubic-bezier(0.2, 0.7, 0.3, 1)",
        backgroundColor: active ? "rgba(139, 155, 110, 0.14)" : "transparent",
        "&:hover": {
          backgroundColor: active ? "rgba(139, 155, 110, 0.18)" : "rgba(42, 37, 32, 0.04)",
          transform: "translateX(2px)",
        },
        ...theme.applyStyles("dark", {
          backgroundColor: active ? "rgba(186, 200, 160, 0.13)" : "transparent",
          "&:hover": {
            backgroundColor: active ? "rgba(186, 200, 160, 0.18)" : "rgba(235, 230, 217, 0.05)",
            transform: "translateX(2px)",
          },
        }),
      })}
    >
      {active && (
        <Box sx={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: "2px", backgroundColor: "primary.main" }} />
      )}

      {isShared ? (
        <PeopleOutlineRoundedIcon
          sx={{
            fontSize: 12,
            color: active ? "primary.main" : "text.disabled",
            flexShrink: 0,
            opacity: 0.75,
          }}
        />
      ) : (
        <Typography
          sx={{
            fontSize: "0.58rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: active ? "primary.main" : "text.disabled",
            minWidth: 18,
            flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
            opacity: 0.85,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </Typography>
      )}

      <Typography
        noWrap
        sx={{
          fontSize: "0.82rem",
          fontWeight: active ? 600 : 500,
          letterSpacing: "-0.005em",
          color: active ? "text.primary" : "text.secondary",
          fontStyle: isShared ? "italic" : "normal",
          lineHeight: 1.3,
          flex: 1,
        }}
      >
        {doc.title || "Untitled"}
      </Typography>

      {isShared && (
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 500, color: "text.disabled", opacity: 0.6, flexShrink: 0 }}>
          {doc.role === "editor" ? "Editor" : "Viewer"}
        </Typography>
      )}
    </Box>
  );
}

export function DocSidebar({ docs, currentId, creating, onCreate }: Props) {
  const user = useCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "";
  const myDocs = docs.filter((d) => d.role === "owner");
  const sharedDocs = docs.filter((d) => d.role !== "owner");

  return (
    <Box
      sx={(theme) => ({
        width: 264,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#EEE8D8",
        height: "100vh",
        position: "relative",
        ...theme.applyStyles("dark", { backgroundColor: "#121006" }),
      })}
    >
      <Box sx={{ px: 3.5, pt: 3.5, pb: 2 }}>
        <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.03em", color: "text.primary", lineHeight: 1 }}>
          Lumen
        </Typography>
        {firstName && (
          <Typography sx={{ mt: 0.5, fontSize: "0.75rem", fontWeight: 500, color: "text.secondary", opacity: 0.7 }}>
            {firstName}&apos;s workspace
          </Typography>
        )}
      </Box>

      <Box className="lumen-draw-line" sx={{ mx: 3.5, height: "1px", backgroundColor: "divider", mb: 2.5, animationDelay: "0.15s" }} />

      <Box sx={{ px: 3.5, display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "text.secondary", opacity: 0.65 }}>Pages</Typography>
        <Tooltip title="New page">
          <IconButton size="small" onClick={!creating ? onCreate : undefined} disabled={creating}
            sx={{ width: 20, height: 20, color: "text.secondary", opacity: 0.55, transition: "all 0.2s", "&:hover": { opacity: 1, color: "primary.main", transform: "rotate(90deg)" } }}>
            <AddRoundedIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 1.5, py: 0.5 }}>
        {myDocs.map((d, i) => <DocItem key={d.id} doc={d} index={i} active={d.id === currentId} />)}

        <Box onClick={!creating ? onCreate : undefined} className="lumen-rise"
          sx={(theme) => ({
            animationDelay: `${0.18 + myDocs.length * 0.025}s`,
            display: "flex", alignItems: "center", gap: 1.25, px: 2, py: 1, mt: 0.75, borderRadius: "4px",
            cursor: creating ? "default" : "pointer", opacity: creating ? 0.45 : 0.55, transition: "all 0.2s",
            "&:hover": { opacity: creating ? 0.45 : 0.9, backgroundColor: creating ? undefined : "rgba(42, 37, 32, 0.04)" },
            ...theme.applyStyles("dark", { "&:hover": { backgroundColor: creating ? undefined : "rgba(235, 230, 217, 0.05)" } }),
          })}
        >
          <AddRoundedIcon sx={{ fontSize: 14, color: "text.disabled", flexShrink: 0, ml: "1px" }} />
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: "text.disabled" }}>New page</Typography>
        </Box>

        {sharedDocs.length > 0 && (
          <>
            <SectionLabel label="Shared with me" />
            {sharedDocs.map((d, i) => <DocItem key={d.id} doc={d} index={i} active={d.id === currentId} />)}
          </>
        )}
      </Box>

      <Box sx={{ px: 3.5, pt: 2, pb: 2.5, borderTop: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
        {user && <UserMenu user={user} />}
      </Box>
    </Box>
  );
}
