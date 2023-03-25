import { useTranslations } from "next-intl";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useToasts } from "react-toast-notifications";
import UserViewProfile from "@/components/common/UserViewProfile";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import React, { useEffect } from "react";
import actionTypes from "@/contexts/action-types";
import { getSession } from "next-auth/client";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import { useRouter } from "next/router";
import PageHeader from "@/components/common/PageHeader";

const MemberProfile = ({ organisation, user }) => {
  const router = useRouter();
  const globalDispatch = useGlobalDispatch();
  const { addToast } = useToasts();
  const t = useTranslations();

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_ORGANISATION,
      payload: organisation,
    });
  }, [organisation]);

  return (
    <ContentErrorBoundary>
      <PageHeader title={t("common.profile")} />
      <UserViewProfile {...{ user }} />
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
      const userResponse = await api({
        url: `/users/${session?.user.id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      const organisationResponse = await api({
        url: `/organisations/${context.query.organisationId}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          user: userResponse.data.data,
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

MemberProfile.authorized = true;
MemberProfile.Layout = DashboardLayout;

export default MemberProfile;
