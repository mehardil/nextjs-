import DelegateDashboardLayout from "@/components/layouts/DelegateDashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import { useTranslations } from "next-intl";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import DelegateGroupForm from "@/components/forms/DelegateGroupForm";
import { getSession } from "next-auth/client";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import { useEffect } from "react";
import actionTypes from "@/contexts/action-types";
import { useGlobalDispatch } from "@/contexts/GlobalContext";

const UserGroups = ({ event }) => {
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
      <PageHeader title="Groups" />
      <div className="row mt-3">
        <div className="col-12">
          <DelegateGroupForm />
        </div>
      </div>
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
      const eventResponse = await api({
        url: `/events/${context.params.eventId}?withBasicStats=1`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

UserGroups.authorized = true;
UserGroups.Layout = DelegateDashboardLayout;

export default UserGroups;
