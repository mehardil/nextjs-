import { useState, forwardRef, useEffect } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventReviewCriteriaTable from "@/components/common/EventReviewCriteriaTable";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import ViewEventSubmissionLayout from "@/components/layouts/ViewEventSubmissionLayout";
import EventReviewCriteriasModal from "@/components/modals/EventReviewCriteriasModal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import PopupAlert from "@/components/ui/PopupAlert";
import { ADMIN } from "@/constants/roles";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import apiPaths from "@/routes/api";
import { withEvent, withEventSubmission } from "@/utils/pipes";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";

const EventSubmissionReviewCriteriaPage = ({
  criteria,
  event,
  submission,
  session,
  headers,
  meta,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const { addToast } = useToasts();
  const eventDispatch = useEventDispatch();
  const [isCriteriaModalOpen, setCriteriaModalOpen] = useState(false);
  const [activeReviewCriteria, setActiveReviewCriteria] = useState();
  const [toEditStages, setToEditStages] = useState();
  const [isSaving, setIsSaving] = useState(false);
  const [toDeleteId, setToDeleteId] = useState();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const pageHeaderToolbar = (
    <Button
      isRounded
      color="primary"
      onClick={() => {
        setActiveReviewCriteria();
        setCriteriaModalOpen(true);
      }}
    >
      <Icon icon="plus" className="mr-2" />
      {t("common.forms.addEntity", {
        entity: t("common.reviewCriteria", { entries: 1 }),
      })}
    </Button>
  );

  /**
   * Handles the create and update of an event
   * submission review criterion.
   *
   * @param {object} reviewCriteriaData
   */
  const onSubmit = async (reviewCriteriaData) => {
    setIsSaving(true);

    const requestBody = requestParamBuilder(reviewCriteriaData, {
      formData: true,
      isPut: !!activeReviewCriteria,
    });

    const url = activeReviewCriteria
      ? apiPaths.EVT_SUBMISSION_REVIEW_CRITERION
      : apiPaths.EVT_SUBMISSION_REVIEW_CRITERIA;

    const notifSuccess = activeReviewCriteria
      ? "common.notifs.successfullyUpdated"
      : "common.notifs.successfullyCreated";

    const notifFail = activeReviewCriteria
      ? "common.notifs.failedToUpdate"
      : "common.notifs.failedToCreate";

    try {
      const response = await api({
        method: "POST",
        data: requestBody,
        headers: { ...headers, "Content-Type": "multipart/form-data" },
        url: interpolatePath(url, {
          eventId: event?.id,
          submissionId: submission?.id,
          reviewCriteriaId: activeReviewCriteria?.id,
        }),
      });

      addToast(
        t(notifSuccess, {
          entityName: reviewCriteriaData?.name,
          entity: t("common.reviewCriteria", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      router.replace(router.asPath);
    } catch (e) {
      addToast(
        t(notifFail, {
          entityName: reviewCriteriaData?.name,
          entity: t("common.reviewCriteria", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Sets the active review criteria to be edited and
   * opens the review criteria modal after.
   *
   * @param {object} reviewCriteriaData
   */
  const handleEdit = (reviewCriteriaData) => {
    setActiveReviewCriteria(reviewCriteriaData);
    setCriteriaModalOpen(true);
  };

  /**
   * Sets the active review criteria and opens up
   * the delete confirmation popup.
   *
   * @param {object} reviewCriteriaData
   */
  const handleDelete = (reviewCriteriaData) => {
    setActiveReviewCriteria(reviewCriteriaData);
    setShowDeleteConfirm(true);
  };

  /**
   * Confirms delete of an event submission review criterion.
   */
  const onConfirmDelete = async () => {
    try {
      const data = await api({
        headers,
        method: "DELETE",
        url: interpolatePath(apiPaths.EVT_SUBMISSION_REVIEW_CRITERION, {
          headers,
          eventId: event?.id,
          submissionId: submission?.id,
          reviewCriteriaId: activeReviewCriteria?.id,
        }),
      });

      addToast(
        t("common.notifs.successfullyDeleted", {
          entityName: activeReviewCriteria?.name,
          entity: t("common.reviewCriteria", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      router.replace(router.asPath);
    } catch (e) {
      addToast(
        t("common.notifs.failedToDelete", {
          entityName: activeReviewCriteria?.name,
          entity: t("common.reviewCriteria", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
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

  /**
   * Sets the submission to be used for the entire submission-related pages.
   * This must be implemented in every submission page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_SUBMISSION,
      payload: submission,
    });
  }, [eventDispatch, submission]);

  return (
    <ContentErrorBoundary>
      <PageHeader
        title={t("common.reviewCriteria", { entries: 1 })}
        toolbar={pageHeaderToolbar}
      />
      {isCriteriaModalOpen && (
        <EventReviewCriteriasModal
          isShow={isCriteriaModalOpen}
          isSaving={isSaving}
          onSubmit={onSubmit}
          defaultValues={activeReviewCriteria}
          onHide={() => {
            setActiveReviewCriteria(undefined);
            setCriteriaModalOpen(false);
          }}
        />
      )}
      {showDeleteConfirm && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText={t("common.forms.delete")}
          confirmBtnBsStyle="danger"
          title={t("common.forms.deleteConfirmation")}
          focusCancelBtn
          onConfirm={onConfirmDelete}
          onCancel={() => {
            setActiveReviewCriteria(undefined);
            setShowDeleteConfirm(false);
          }}
        >
          {t("common.alerts.areYouSureToDelete", {
            entityName: activeReviewCriteria?.name,
            entity: t("common.reviewCriteria", { entries: 1 }),
          })}
        </PopupAlert>
      )}
      <Panel
        title={t("common.reviewCriteria", { entries: 2 })}
        maximizable
        className="mt-4"
        color="inverse"
      >
        <EventReviewCriteriaTable
          items={criteria}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) =>
  serverSidePipe(context, [withEvent, withEventSubmission])(
    async (context, pipeProps) => {
      const session = await getSession(context);
      const urlQueryString = queryString.stringify({
        ...context.query,
        page: context.query.page || 1,
      });

      if (session) {
        const headers = {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        };

        const reviewCriteriaResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_SUBMISSION_REVIEW_CRITERIA, {
            eventId: pipeProps?.event?.id,
            submissionId: pipeProps?.submission?.id,
            query: {
              ...context.query,
              page: context.query.page || 1,
              include: "extraLinks",
            },
          }),
        });

        return {
          props: {
            headers,
            session,
            ...pipeProps,
            context: await getContextProps(context),
            criteria: reviewCriteriaResponse.data.data,
            meta: reviewCriteriaResponse.data.meta,
          },
        };
      }

      return {
        notFound: true,
      };
    }
  );

EventSubmissionReviewCriteriaPage.authorized = true;
EventSubmissionReviewCriteriaPage.allowedRoles = [ADMIN];
EventSubmissionReviewCriteriaPage.Layout = ViewEventSubmissionLayout;
EventSubmissionReviewCriteriaPage.defaultProps = {
  criterias: [],
};

export default EventSubmissionReviewCriteriaPage;
