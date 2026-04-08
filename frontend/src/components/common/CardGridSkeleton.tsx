import { Box, Card, CardContent, Skeleton, Grid } from "@mui/material";

interface Props {
  cards?: number;
}

export default function CardGridSkeleton({ cards = 6 }: Props) {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: cards }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            elevation={0}
            sx={{ borderRadius: 3, border: "1.5px solid", borderColor: "divider" }}
          >
            <CardContent sx={{ px: 2, pt: 1.75, pb: "16px !important" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Skeleton variant="text" width="55%" height={20} />
                <Skeleton variant="rounded" width={70} height={18} sx={{ borderRadius: 4 }} />
              </Box>
              <Skeleton variant="text" width="40%" height={14} />
              <Skeleton variant="text" width="30%" height={14} sx={{ mt: 0.5 }} />
              <Skeleton variant="rounded" width="100%" height={32} sx={{ mt: 2, borderRadius: 1.5 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
