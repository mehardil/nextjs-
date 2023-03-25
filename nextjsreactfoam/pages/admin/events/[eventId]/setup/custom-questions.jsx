import React, { useEffect, useState } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import EventSetupHeader from "@/components/common/EventSetupHeader";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import { useToasts } from "react-toast-notifications";
import queryString from "query-string";
import EventCustomQuestionModal from "@/components/modals/EventCustomQuestionModal";
import answerTypes from "@/constants/answerTypes";
import SanitizedHTML from "react-sanitized-html";
import requestParamBuilder from "@/utils/requestParamBuilder";
import PopupAlert from "@/components/ui/PopupAlert";
import Table from "@/components/ui/Table";

const EventSetupCustomQuestions = ({
  customQuestions,
  event,
  context,
  session,
  meta,
  linkAddons,
  linkDelegate,
  linkRegistrationType,
  linkOrganisation,
}) => {
  const router = useRouter();
  const eventDispatch = useEventDispatch();
  const [isSaving, setSaving] = useState(false);
  const [isShowCustomQuestion, setShowCustomQuestion] = useState(false);
  const [toEditCustomQuestion, setToEditCustomQuestion] = useState();
  const [toDeleteCustomQuestion, setToDeleteCustomQuestion] = useState();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const initialNumOfEntries = context.query.perPage;
  const t = useTranslations();
  const { addToast } = useToasts();

  const columns = [
    { key: "question" },
    { key: "answer_type", label: "Answer Type" },
    { key: "mandatory" },
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

  const onCreate = async (data) => {
    try {
      data.length = data?.length ?? 0;

      if (
        data?.linked_delegate_types &&
        data?.linked_delegate_types.length > 0
      ) {
        data.linked_delegate_types = data?.linked_delegate_types
          .map((delegateType) => delegateType.value)
          .join();
      }

      if (
        data?.linked_registration_types &&
        data?.linked_registration_types.length > 0
      ) {
        data.linked_registration_types = data?.linked_registration_types
          .map((registrationType) => registrationType.value)
          .join();
      }

      if (!data?.linked_addons) {
        delete data?.linked_addons;
      }

      if (!data?.linked_organisations) {
        delete data?.linked_organisations;
      }

      if (!data?.answers) {
        delete data?.answers;
      }

      const params = requestParamBuilder(data, { formData: true });

      setSaving(true);

      await api({
        url: `/events/${event.id}/custom-questions/`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
        data: params,
      });

      addToast(
        t("common.notifs.successfullyCreated", {
          entityName: "",
          entity: t("common.customQuestion", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      setShowCustomQuestion(false);

      refreshData();
    } catch (e) {
      addToast(
        t("common.notifs.failedToCreate", {
          entityName: "",
          entity: t("common.customQuestion", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    } finally {
      setSaving(false);
    }
  };

  const onSaveChanges = async (data) => {
    try {
      data.length = data?.length ?? 0;

      if (
        data?.linked_delegate_types &&
        data?.linked_delegate_types.length > 0
      ) {
        data.linked_delegate_types = data?.linked_delegate_types
          .map((delegateType) => delegateType.value)
          .join();
      }

      if (
        data?.linked_registration_types &&
        data?.linked_registration_types.length > 0
      ) {
        data.linked_registration_types = data?.linked_registration_types
          .map((registrationType) => registrationType.value)
          .join();
      }

      if (!data?.linked_addons) {
        delete data?.linked_addons;
      }

      if (!data?.linked_organisations) {
        delete data?.linked_organisations;
      }

      if (!data?.answers) {
        delete data?.answers;
      }

      const params = requestParamBuilder(data, { formData: true, isPut: true });

      setSaving(true);

      await api({
        url: `/events/${event.id}/custom-questions/${toEditCustomQuestion?.id}`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
          "Content-Type": "multipart/form-data",
        },
        data: params,
      });

      setToEditCustomQuestion(undefined);

      addToast(
        t("common.notifs.successfullyUpdated", {
          entityName: "",
          entity: t("common.customQuestion", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      refreshData();
    } catch (e) {
      addToast(
        t("common.notifs.failedToUpdate", {
          entityName: "",
          entity: t("common.customQuestion", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data) => {
    toEditCustomQuestion?.id ? onSaveChanges(data) : onCreate(data);
  };

  const handleDelete = (item) => {
    setToDeleteCustomQuestion(item?.id);
    setShowConfirmation(true);
  };

  const onConfirmDelete = async () => {
    setSaving(true);

    try {
      await api({
        url: `/events/${event.id}/custom-questions/${toDeleteCustomQuestion}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      setToDeleteCustomQuestion(undefined);
      setShowConfirmation(false);

      addToast(
        t("common.notifs.successfullyDeleted", {
          entityName: "",
          entity: t("common.customQuestion", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      refreshData();
    } catch (e) {
      addToast(
        t("common.notifs.failedToDelete", {
          entityName: "",
          entity: t("common.customQuestion", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    } finally {
      setSaving(false);
    }
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={() => {
        setShowCustomQuestion(true);
      }}
    >
      <Icon icon="plus" className="mr-1" />
      {t("common.forms.addNewEntity", {
        entity: t("common.question", { entries: 1 }),
      })}
    </Button>
  );

  const dropdownOptions = (item) => {
    return [
      {
        label: (
          <>
            <Icon icon="trash" />
            &nbsp;Delete
          </>
        ),
        onClick: () => {
          handleDelete(item);
        },
      },
    ];
  };

  const scopedSlots = {
    action: (item) => (
      <>
        <Button.Dropdown size="xs" options={dropdownOptions(item)}>
          <Button
            onClick={() => {
              setShowCustomQuestion(true);
              setToEditCustomQuestion(item);
            }}
          >
            Edit
          </Button>
        </Button.Dropdown>
      </>
    ),
    answer_type: (item) => {
      const answerType = Object.entries(answerTypes).filter(([key, value]) => {
        return key == item?.answer_type;
      });

      if (answerType.length === 0) return <td></td>;

      return <td>{answerType[0][1] || ""}</td>;
    },
    mandatory: (item) => {
      return (
        <td>
          {item.mandatory
            ? t("common.yes", { entries: 1 })
            : t("common.no", { entries: 1 })}
        </td>
      );
    },
    question: ({ question }) => {
      if (question === "undefined") {
        return <td />;
      }

      return (
        <td className="custom-question-cell">
          <SanitizedHTML html={question} />
        </td>
      );
    },
  };

  return (
    <>
      <PageHeader
        title="Edit Event"
        toolbar={pageHeaderToolbar}
        description={<EventSetupHeader />}
      />

      <Panel
        title={t("common.customQuestion", { entries: 2 })}
        color="inverse"
        maximizable
        collapsable
      >
        <Table
          items={customQuestions}
          columns={columns}
          scopedSlots={scopedSlots}
          onPageChange={handlePageChange}
          initialPage={meta.current_page}
          numOfPages={meta.last_page}
          initialKeyword={context.query.keyword}
          onKeywordChange={handleKeywordChange}
          batchActions={[]}
          bordered
          {...{ initialNumOfEntries }}
        />
      </Panel>
      {isShowCustomQuestion && (
        <EventCustomQuestionModal
          isShow={isShowCustomQuestion}
          onHide={() => setShowCustomQuestion(false)}
          isSaving={isSaving}
          onSubmit={onSubmit}
          defaultValues={toEditCustomQuestion}
          addons={linkAddons}
          delegates={linkDelegate}
          registrationTypes={linkRegistrationType}
          organisations={linkOrganisation}
        />
      )}
      {showConfirmation && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText="Delete"
          confirmBtnBsStyle="danger"
          title="Delete Confirmation"
          focusCancelBtn
          onConfirm={onConfirmDelete}
          onCancel={() => {
            setToDeleteCustomQuestion();
            setShowConfirmation(false);
          }}
        >
          {t("common.alerts.areYouSureToDelete", {
            entityName: "",
            entity: t("common.customQuestion", { entries: 1 }),
          })}
        </PopupAlert>
      )}
    </>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  const urlQueryString = queryString.stringify({
    ...context.query,
    page: context.query.page || 1,
  });

  const questionResponse = await api({
    url: `/events/${context.params.eventId}/custom-questions?${urlQueryString}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    },
  });

  const eventResponse = await api({
    url: `/events/${context.params.eventId}`,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    },
  });

  const linkaddonsResponse = await api({
    url: `/events/${context.params.eventId}/addons`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    },
  });

  const linkDelegateResponse = await api({
    url: `/events/${context.params.eventId}/attendee-types`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    },
  });

  const linkRegistrationTypeResponse = await api({
    url: `/events/${context.params.eventId}/event-items`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    },
  });

  const linkOrganisationResponse = await api({
    url: `/events/${context.params.eventId}/organisations`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    },
  });

  /**
   * To request to an authorized API, session has to be set. Session
   * has the accessToken which is required to access Currinda API.
   */
  if (session) {
    /**
     * MUST: Always pass the session and context
     * data to the component to have an access to essential
     * data such as the "session.accessToken" inside the component.
     */
    return {
      props: {
        session,
        context: await getContextProps(context),
        customQuestions: questionResponse.data.data,
        meta: questionResponse.data.meta,
        event: eventResponse.data.data,
        linkAddons: linkaddonsResponse.data.data,
        linkDelegate: linkDelegateResponse.data.data,
        linkRegistrationType: linkRegistrationTypeResponse.data.data,
        linkOrganisation: linkOrganisationResponse.data.data,
      },
    };
  }

  /**
   * Always return a "prop" property, or else an
   * error will occur.
   */
  return {
    props: {
      submissions: questionResponse.data.data,
    },
  };
};

EventSetupCustomQuestions.Layout = ViewEventLayout;

export default EventSetupCustomQuestions;
