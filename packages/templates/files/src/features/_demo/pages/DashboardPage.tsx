// DEMO PAGE — safe to delete. Exists so the scaffolded app boots and renders
// through the real router + i18n + theme. When you add your first feature, point
// the dashboard route at it (or delete the whole features/_demo folder).
//
// v7 lazy route module: export `Component` (and optionally `loader`/`action`).
// There is NO hardcoded text here — every string comes from t(). View/filter
// state lives in the URL (?count=N) so it survives refresh and is shareable.
import { useSearchParams } from "react-router-dom";
import { Box, Button, Container, Typography } from "@mui/material";
import { useTranslation } from "@/i18n";

export function Component() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const count = Number(searchParams.get("count") ?? "1") || 1;

  const setCount = (next: number): void => {
    setSearchParams(
      (prev) => {
        if (next <= 1) prev.delete("count"); // omit defaults -> clean URLs
        else prev.set("count", String(next));
        return prev;
      },
      { replace: true },
    );
  };

  return (
    <Container sx={{ py: 6 }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
        <Typography variant="h4" component="h1">
          {t("titles.home")}
        </Typography>
        <Typography color="text.secondary">{t("labels.foundationReady")}</Typography>
        <Typography>{t("descriptions.homeIntro")}</Typography>
        <Typography variant="body2">{t("labels.featureCount", { count })}</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" onClick={() => setCount(count + 1)}>
            {t("buttons.getStarted")}
          </Button>
          <Button variant="text" onClick={() => setCount(1)}>
            {t("buttons.learnMore")}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
