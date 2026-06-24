// Shared errorElement — catches thrown errors, loader rejections, and renders the
// 404 for unmatched routes. All copy via i18n. See project-setup/routing.md.
import { isRouteErrorResponse, useRouteError, Link } from "react-router-dom";
import { Button, Container, Typography } from "@mui/material";
import { useTranslation } from "@/i18n";
import { paths } from "./paths";

export default function RouteError() {
  const error = useRouteError();
  const { t } = useTranslation();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <Container sx={{ py: 6 }} role="alert">
      <Typography variant="h4" component="h1" gutterBottom>
        {notFound ? t("titles.notFound") : t("titles.error")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {notFound ? t("descriptions.notFound") : t("descriptions.error")}
      </Typography>
      <Button component={Link} to={paths.home} variant="contained">
        {t("buttons.goHome")}
      </Button>
    </Container>
  );
}
