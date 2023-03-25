import React, { useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import { getSession } from "next-auth/client";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import OrganisationMembershipWizard from "@/components/forPage/OrganisationMembershipWizard";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import actionTypes from "@/contexts/action-types";

const Join = ({ organisation }) => {
  const globalDispatch = useGlobalDispatch();

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_ORGANISATION,
      payload: organisation,
    });
  }, []);

  return (
    <ContentErrorBoundary>
      <PageHeader title={organisation?.long_name} />
      <OrganisationMembershipWizard />
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const organisationResponse = await api({
        url: `/organisations/${context.query.organisationId}?withAddons=1&&withExtras=1&&withChapters=1`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          organisation: organisationResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

Join.authorized = true;
Join.Layout = DashboardLayout;

export default Join;
