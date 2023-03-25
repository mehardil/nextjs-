import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import { ADMIN } from "@/constants/roles";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import apiPaths from "@/routes/api";
import paths, { ADMIN_EVT_EDIT_SUBMISSION } from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import PopupAlert from "@/components/ui/PopupAlert";
import * as React from "react";
import { useToasts } from "react-toast-notifications";

const AllSubmissions = ({ submissions, event, context, session, meta }) => {
  const router = useRouter();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSubmission, setCurrentSubmission] = useState(undefined);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToasts();
  const initialNumOfEntries = context.query.perPage;

  const columns = [
    { key: "name" },
    { key: "submission_open_date", label: "Submission Open Date" },
    { key: "action", _style: { width: "5%" } },
  ];

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  const scopedSlots = {
    action: (item) => (
      <>
        <Button.Dropdown
          size="xs"
          color="white"
          options={[
            {
              label: "Edit",
              onClick: () => {
                router.push({
                  pathname: paths.ADMIN_EVT_EDIT_SUBMISSION,
                  query: { eventId: event.id, submissionId: item.id },
                });
              },
            },
            {
              label: "Delete",
              onClick: () => {
                setCurrentSubmission(item);
                setShowDeleteConfirmation(true);
              },
            },
          ]}
        >
          <Button
            onClick={() =>
              router.push({
                pathname: paths.ADMIN_EVT_SUBMISSIONS_DASHBOARD,
                query: { eventId: event.id, submissionId: item.id },
              })
            }
          >
            Open
          </Button>
        </Button.Dropdown>
      </>
    ),
  };

  const pageHeaderToolbar = (
    <Link
      href={{
        pathname: paths.ADMIN_EVT_SUBMISSIONS_ADD,
        query: { eventId: event?.id },
      }}
      passHref
    >
      <Button tag="a" color="primary" isCircle>
        <Icon icon="plus" className="mr-1" />
        {t("common.forms.addNewEntity", {
          entity: t("common.submission", { entries: 1 }),
        })}
      </Button>
    </Link>
  );

  const handlePageChange = ({ selected }) => {
    router.query.page = selected;
    router.push(router);
  };

  const handleKeywordChange = (keyword) => {
    router.query.keyword = keyword;
    router.push(router);
  };

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const handleDeleteSubmission = async () => {
    setIsLoading(true);

    try {
      await api({
        url: `/events/${event.id}/submissions/${currentSubmission?.id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      addToast(
        t("common.notifs.successfullyDeleted", {
          entityName: "",
          entity: t("common.submission", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      setCurrentSubmission(undefined);
      setShowDeleteConfirmation(false);

      refreshData();
    } catch (e) {
      addToast(
        t("common.notifs.failedToDelete", {
          entityName: "",
          entity: t("common.submission", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ContentErrorBoundary>
      <PageHeader title="Event Submissions" toolbar={pageHeaderToolbar} />
      <Panel title="Submissions" color="inverse" maximizable collapsable>
        <Table
          items={submissions}
          columns={columns}
          scopedSlots={scopedSlots}
          onPageChange={handlePageChange}
          initialPage={meta.current_page}
          numOfPages={meta.last_page}
          initialKeyword={context.query.keyword}
          onKeywordChange={handleKeywordChange}
          batchActions={[]}
          bordered
          initialNumOfEntries={initialNumOfEntries}
        />
      </Panel>
      {showDeleteConfirmation && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText="Delete"
          confirmBtnBsStyle="danger"
          title="Delete Confirmation"
          focusCancelBtn
          onConfirm={handleDeleteSubmission}
          onCancel={() => {
            setCurrentSubmission(undefined);
            setShowDeleteConfirmation(false);
          }}
          isLoading={isLoading}
        >
          {t("common.alerts.areYouSureToDelete", {
            entityName: "",
            entity: t("common.submission", { entries: 1 }),
          })}
        </PopupAlert>
      )}
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  /**
   * To request to an authorized API, session has to be set. Session
   * has the accessToken which is required to access Currinda API.
   */
  if (session) {
    const eventResponse = await api({
      headers,
      url: interpolatePath(apiPaths.EVT, { eventId: context.params.eventId }),
    });

    const submissionsResponse = await api({
      headers,
      url: interpolatePath(apiPaths.EVT_SUBMISSIONS, {
        eventId: context.params.eventId,
        query: {
          ...context.query,
          page: context.query.page || 1,
        },
      }),
    });

    /**
     * MUST: Always pass the session and context
     * data to the component to have an access to essential
     * data such as the "session.accessToken" inside the component.
     */
    return {
      props: {
        session,
        context: await getContextProps(context),
        event: eventResponse.data.data,
        submissions: submissionsResponse.data.data,
        meta: submissionsResponse.data.meta,
      },
    };
  }

  /**
   * Always return a "prop" property, or else an
   * error will occur.
   */
  return {
    notFound: true,
  };
};

AllSubmissions.authorized = true;
AllSubmissions.allowedRoles = [ADMIN];
AllSubmissions.Layout = ViewEventLayout;
AllSubmissions.defaultProps = {
  submissions: [],
};

export default AllSubmissions;
