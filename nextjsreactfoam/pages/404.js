import Link from "next/link";
import { useTranslations } from "next-intl";
import ErrorPage from "@/components/common/ErrorPage";
import Button from "@/components/ui/Button";

export default function Custom404() {
  const t = useTranslations();
  return (
    <ErrorPage
      heading={t("errors.page.404.fourOFour")}
      message={t("errors.page.404.couldntFindIt")}
      description={t("errors.page.404.pageDoesntExist")}
    >
      <Link href="/">
        <a className="btn btn-success p-l-20 p-r-20">{t("common.goHome")}</a>
      </Link>
    </ErrorPage>
  );
}
