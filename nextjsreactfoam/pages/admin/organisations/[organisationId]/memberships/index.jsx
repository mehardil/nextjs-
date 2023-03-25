import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getSession } from "next-auth/client";
import { useRouter } from "next/router";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import ViewOrganisationLayout from "@/components/layouts/ViewOrganisationLayout";
import Panel from "@/components/ui/Panel";
import { ADMIN } from "@/constants/roles";
import paths from "@/routes/paths";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import actionTypes from "@/contexts/action-types";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";
import MembershipTable from "@/components/common/MembershipTable";

const OrganisationMemberships = ({
  organisation,
  memberships,
  context,
  session,
  meta,
}) => {
  const organisationDispatch = useOrganisationDispatch();
  const router = useRouter();
  const t = useTranslations();
  const initialNumOfEntries = context.query.perPage;

  const columns = [
    { key: "id", label: "ID" },
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
  ];

  const scopedSlots = {
    first_name: ({ id, user }) => {
      return (
        <Link
          href={{
            pathname: paths.ADMIN_ORG_MEMBERSHIPS_DASHBOARD,
            query: { organisationId: organisation?.id, membershipId: id },
          }}
        >
          <a>{user?.first_name}</a>
        </Link>
      );
    },
    last_name: ({ id, user }) => (
      <Link
        href={{
          pathname: paths.ADMIN_ORG_MEMBERSHIPS_DASHBOARD,
          query: { organisationId: organisation?.id, membershipId: id },
        }}
      >
        <a>{user?.last_name}</a>
      </Link>
    ),
  };

  React.useEffect(() => {
    organisationDispatch({
      type: actionTypes.SET_ORGANISATION,
      payload: organisation,
    });
  }, [organisation]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Memberships" />
      <Panel
        title="Organisation Membership"
        color="inverse"
        maximizable
        collapsable
      >
        <MembershipTable
          items={memberships}
          columns={columns}
          scopedSlots={scopedSlots}
          initialPage={meta.current_page}
          numOfPages={meta.last_page}
          totalItems={meta.total}
          from={meta.from}
          to={meta.to}
          initialKeyword={context.query.keyword}
          initialNumOfEntries={initialNumOfEntries}
        />
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  const parsedQueryString = queryString.parse(context.req.url.split("?")[1]);
  const urlQueryString = queryString.stringify({
    ...parsedQueryString,
    page: context.query.page || 1,
    withUserData: 1,
  });

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const organisationResponse = await api({
        url: `/organisations/${context.params.organisationId}`,
        headers,
      });

      const membershipsResponse = await api({
        url: `/organisations/${context.params.organisationId}/memberships?${urlQueryString}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          organisation: organisationResponse.data.data,
          memberships: membershipsResponse?.data?.data,
          meta: membershipsResponse.data.meta,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }

  return {
    notFound: true,
  };
};

OrganisationMemberships.authorized = true;
OrganisationMemberships.allowedRoles = [ADMIN];
OrganisationMemberships.Layout = ViewOrganisationLayout;

export default OrganisationMemberships;
