import React, { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import { useToasts } from "react-toast-notifications";
import queryString from "query-string";
import mapKeys from "lodash/mapKeys";
import Link from "next/link";
import paths from "@/routes/paths";
import omit from "lodash/omit";
import snakeCase from "lodash/snakeCase";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import PopupAlert from "@/components/ui/PopupAlert";
import Table from "@/components/ui/Table";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import { deleteUserRegistration } from "@/requests/userRegistration";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import DelegatesTabs from "@/components/common/DelegatesTabs";

const Delegates = ({ event, delegates, meta, context, session }) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const initialNumOfEntries = context.query.perPage;
  const [activeRegistration, setActiveRegistration] = useState();
  const [isShowDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const columns = [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "item_name", label: "Item Name" },
    { key: "registration", label: "Registration" },
    { key: "submissions", label: "Submissions" },
    { key: "date_added", label: "Date Added" },
    { key: "date_modified", label: "Date Modified" },
    { key: "action", label: "Action" },
  ];

  const handleDelete = (registration) => {
    setActiveRegistration(registration);
    setShowDeleteConfirm(true);
  };

  const scopedSlots = {
    first_name: ({ id, user }) => {
      return (
        <Link
          href={{
            pathname: paths.ADMIN_EVT_DELEGATES_DASHBOARD,
            query: { eventId: router.query.eventId, delegateId: id },
          }}
        >
          <a>{user?.first_name}</a>
        </Link>
      );
    },
    last_name: ({ id, user }) => (
      <>
        <Link
          href={{
            pathname: paths.ADMIN_EVT_DELEGATES_DASHBOARD,
            query: { eventId: router.query.eventId, delegateId: id },
          }}
        >
          {user?.last_name}
        </Link>
      </>
    ),
    action: (registration) => (
      <Button.Dropdown size="xs" color="white">
        <Button onClick={() => handleDelete(registration)}>
          {t("common.forms.delete")}
        </Button>
      </Button.Dropdown>
    ),
  };

  const handlePageChange = ({ selected }) => {
    router.query.page = selected;
    router.push(router);
  };

  const handleKeywordChange = (keyword) => {
    router.query.keyword = keyword;
    router.push(router);
  };

  const onConfirmDelete = async () => {
    try {
      await deleteUserRegistration(
        activeRegistration?.id,
        event?.id,
        session?.accessToken
      );

      addToast(
        t("common.notifs.successfullyDeleted", {
          entityName: "",
          entity: t("common.registration", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      router.push(router);
    } catch (e) {
      addToast(e.response.data.message, {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, eventDispatch]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="All Delegates" />
      {isShowDeleteConfirm && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText={t("common.forms.delete")}
          confirmBtnBsStyle="danger"
          title={t("common.forms.deleteConfirmation")}
          focusCancelBtn
          onConfirm={onConfirmDelete}
          onCancel={() => {
            setActiveRegistration();
            setShowDeleteConfirm(false);
          }}
        >
          {t("common.alerts.areYouSureToDelete", {
            entityName: "",
            entity: t("common.registration", { entries: 1 }),
          })}
        </PopupAlert>
      )}
      <DelegatesTabs />

      <Panel title="Event Delegates" color="inverse" maximizable collapsable>
        <Table
          items={delegates}
          columns={columns}
          scopedSlots={scopedSlots}
          onPageChange={handlePageChange}
          initialPage={meta.current_page}
          numOfPages={meta.last_page}
          initialKeyword={context.query.keyword}
          onKeywordChange={handleKeywordChange}
          bordered
          {...{ initialNumOfEntries }}
        />
      </Panel>
    </ContentErrorBoundary>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  const parsedQueryString = queryString.parse(context.req.url.split("?")[1]);
  const urlQueryString = queryString.stringify({
    ...parsedQueryString,
    page: context.query.page || 1,
  });

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}`,
        headers,
      });


      const delegatesResponse = await api({
        url: `/events/${context.params.eventId}/registrations?${urlQueryString}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          delegates: delegatesResponse.data.data,
          meta: delegatesResponse.data.meta,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

Delegates.Layout = ViewEventLayout;

export default Delegates;
