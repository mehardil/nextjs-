import React, { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/common/PageHeader";
import ViewDelegateLayout from "@/components/layouts/ViewDelegateLayout";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import actionTypes from "@/contexts/action-types";
import { useEventDispatch } from "@/contexts/EventContext";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";

const DelegateUserSubmissions = ({ registration, userSubmissions, meta }) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();

  const tableColumns = [
    { key: "id", label: "Submission ID" },
    { key: "title", label: "Event Delegates" },
    { key: "society", label: "Society" },
    { key: "reviews_count", label: "Reviews" },
    { key: "average_review_score", label: "Avg. Review Score" },
  ];

  const tableScopedSlots = {
    society: ({ submission }) => <>{submission?.name}</>,
  };

  /**
   * Sets the delegate to be used for the entire delegate-related pages.
   * This must be implemented in every delegate page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_REGISTRATION,
      payload: registration,
    });
  }, [registration]);

  return (
    <>
      <PageHeader title={t("common.userSubmission", { entries: 2 })} />
      <Panel
        title={t("common.userSubmission", { entries: 2 })}
        color="inverse"
        maximizable
        collapsable
      >
        <Table
          items={userSubmissions}
          columns={tableColumns}
          scopedSlots={tableScopedSlots}
          bordered
        />
      </Panel>
    </>
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
      const registrationResponse = await api({
        headers,
        url: interpolatePath(apiPaths.EVT_REGISTRATION, {
          eventId: context.params.eventId,
          registrationId: context.params.delegateId,
        }),
      });

      const delegateUserSubmissions = await api({
        headers,
        url: interpolatePath(apiPaths.EVT_USERSUBMISSIONS, {
          eventId: context.params.eventId,
          query: {
            forUser: registrationResponse.data.data.user?.id,
            include: "submission",
            page: context.query.page || 1,
            ...context.query,
          },
        }),
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          registration: registrationResponse.data.data,
          userSubmissions: delegateUserSubmissions.data.data,
          meta: delegateUserSubmissions.data.meta,
        },
      };
    } catch (e) {
      return {
        notFound: true,
      };
    }
  }

  return {
    notFound: true,
  };
};

DelegateUserSubmissions.Layout = ViewDelegateLayout;

export default DelegateUserSubmissions;
