import React from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/router";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import OrganisationsTable from "@/components/common/OrganisationsTable";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import { ADMIN } from "@/constants/roles";
import apiPaths from "@/routes/api";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";

const UnmanagedOrganisations = ({ organisations, context, meta }) => {
  const t = useTranslations();

  const pageHeaderToolbar = (
    <Link href={paths.ADMIN_ORG_ADD} passHref>
      <Button tag="a" color="primary" isCircle>
        <Icon icon="plus" className="mr-1" />
        {t("common.forms.addNewEntity", {
          entity: t("common.organisation", { entries: 1 }),
        })}
      </Button>
    </Link>
  );

  return (
    <ContentErrorBoundary>
      <PageHeader
        toolbar={pageHeaderToolbar}
        title={t("common.managedEntity", {
          entity: t("common.organisation", { entries: 2 }),
        })}
      />
      <Panel
        title={t("common.organisation", { entries: 2 })}
        color="inverse"
        maximizable
        collapsable
      >
        <OrganisationsTable
          items={organisations}
          initialPage={meta.current_page}
          numOfPages={meta.last_page}
          totalItems={meta.total}
          from={meta.from}
          to={meta.to}
          initialKeyword={context.query.keyword}
          initialNumOfEntries={context.query.perPage}
        />
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    const orgResponse = await api({
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
      url: interpolatePath(apiPaths.ORGS, {
        query: {
          ...context.query,
          page: context.query.page || 1,
          managed: 0,
          sortBy: "ID",
        },
      }),
    });

    return {
      props: {
        session,
        context: await getContextProps(context),
        organisations: orgResponse.data.data,
        meta: orgResponse.data.meta,
      },
    };
  }

  return {
    notFound: true,
  };
};

UnmanagedOrganisations.authorized = true;
UnmanagedOrganisations.allowedRoles = [ADMIN];
UnmanagedOrganisations.Layout = DashboardLayout;
UnmanagedOrganisations.defaultProps = {
  organisations: [],
};

export default UnmanagedOrganisations;
