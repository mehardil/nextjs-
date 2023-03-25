import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Icon from "@/components/ui/Icon";
import Note from "@/components/ui/Note";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import actionTypes from "@/contexts/action-types";

const Reviews = ({ event }) => {
  const globalDispatch = useGlobalDispatch();
  const t = useTranslations();

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Reviews" />
      <Note icon={<Icon icon="drawer" type="line" size="xs" />} color="primary">
        <h4>Nothing to review.</h4>
        <p className="mb-0">No submissions that were assigned to you.</p>
      </Note>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    const eventResponse = await api({
      url: `/events/${context.params.eventId}`,
      headers,
    });

    const stagesResponse = await api({
      url: `/user-submission-stages?event=${context.params.eventId}&user=${session.user.id}`,
      headers,
    });

    if (stagesResponse?.data?.data?.length) {
      return {
        redirect: {
          destination: `/events/${context.params.eventId}/reviews/${stagesResponse.data.data[0].id}`,
          permanent: false,
        },
      };
    }

    return {
      props: {
        session,
        context: await getContextProps(context),
        event: eventResponse.data.data,
      },
    };
  }

  return {
    notFound: true,
  };
};

Reviews.authorized = true;
Reviews.Layout = DashboardLayout;

export default Reviews;
