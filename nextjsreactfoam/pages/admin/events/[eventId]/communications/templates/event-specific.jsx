import { useState, useEffect } from "react";
import * as React from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import { useToasts } from "react-toast-notifications";
import { useRouter } from "next/router";
import isObject from "lodash/isObject";
import PopupAlert from "@/components/ui/PopupAlert";
import CommunicationMailTemplateModal from "@/components/modals/CommunicationMailTemplateModal";
import EventCommunicationTemplateHeader from "@/components/common/EventCommunicationTemplateHeader";
import CommunicationTemplateTable from "@/components/common/CommunicationTemplateTable";
import interpolatePath from "@/utils/interpolatePath";
import apiPaths from "@/routes/api";

const EventSpecifc = ({ event, mailTemplates, meta, context }) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const initialNumOfEntries = context.query.perPage;
  const { addToast } = useToasts();
  const router = useRouter();
  const [
    isCommunicationTemplateModalActive,
    setCommunicationTemplateModalActive,
  ] = useState(false);
  const [toEditCommunicationTemplate, setToEditCommunicationTemplate] =
    useState();
  const [isSaving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toDeleteCommunicationTemplateId, setToCommunicationTemplateId] =
    useState();

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

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={() => {
        setCommunicationTemplateModalActive(true);
        setToEditCommunicationTemplate();
      }}
    >
      <Icon icon="plus" className="mr-1" />
      {t("common.forms.addNewEntity", {
        entity: t("common.template", { entries: 1 }),
      })}
    </Button>
  );

  const handleDelete = (id) => {
    setToCommunicationTemplateId(id);
    setShowDeleteConfirm(true);
  };

  const handleEdit = (item) => {
    setToEditCommunicationTemplate(item);
    setCommunicationTemplateModalActive(true);
  };

  const onSaveChanges = async ({ target, ...data }) => {
    const params = {
      entity_type: "Event",
      entity: event?.id,
      target: isObject(target) ? target?.value : target,
      ...data,
    };
    setSaving(true);
    const session = await getSession(context);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      await api.put(
        interpolatePath(apiPaths.MAIL_TEMPLATE, {
          mailTemplateId: toEditCommunicationTemplate?.id,
        }),
        params,
        { headers }
      );

      addToast("Email template successfully updated.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast("Failed to update email template.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const onConfirmDelete = async () => {
    const session = await getSession(context);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      await api.delete(
        interpolatePath(apiPaths.MAIL_TEMPLATE, {
          mailTemplateId: toDeleteCommunicationTemplateId,
        }),
        { headers }
      );

      addToast("Email template successfully deleted.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast("Failed to delete email template.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data) => {
    toEditCommunicationTemplate?.id ? onSaveChanges(data) : onCreate(data);
  };

  const onCreate = async ({ target, ...data }) => {
    const params = {
      entity_type: "Event",
      entity: event?.id,
      target: target?.value,
      ...data,
    };
    setSaving(true);
    const session = await getSession(context);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      await api.post(apiPaths.MAIL_TEMPLATES, params, { headers });

      refreshData();

      addToast("Email template successfully added.", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      addToast("Failed to add email template.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setCommunicationTemplateModalActive(false);
    }
  };

  return (
    <ContentErrorBoundary>
      {isCommunicationTemplateModalActive && (
        <CommunicationMailTemplateModal
          isShow={isCommunicationTemplateModalActive}
          onHide={() => {
            setCommunicationTemplateModalActive(false);
          }}
          defaultValues={toEditCommunicationTemplate}
          onSubmit={onSubmit}
          isSaving={isSaving}
        />
      )}
      <PageHeader
        title={t("common.template", { entries: 2 })}
        toolbar={pageHeaderToolbar}
      />
      <EventCommunicationTemplateHeader />
      <Panel
        l
        maximizable
        color="inverse"
        title={t("common.template", { entries: 2 })}
      >
        <CommunicationTemplateTable
          items={mailTemplates}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />

        {showDeleteConfirm && (
          <PopupAlert
            danger
            showCancel
            confirmBtnText="Delete"
            confirmBtnBsStyle="danger"
            title="Delete Confirmation"
            focusCancelBtn
            type="danger"
            desc="Are you sure you want to delete this email template?"
            onConfirm={onConfirmDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          >
            Are you sure you want to delete this email template?
          </PopupAlert>
        )}
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

  if (session) {
    const headers = {
      Authorization: `Bearer ${session?.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      const eventResponse = await api({
        url: interpolatePath(apiPaths.EVT, { eventId: context.params.eventId }),
        headers,
      });
      const mailTemplateResponse = await api({
        url: interpolatePath(apiPaths.MAIL_TEMPLATES, {
          query: {
            entity_type: "Event",
            entity: context.params.eventId,
          },
        }),
        method: "GET",
        headers: headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          mailTemplates: mailTemplateResponse.data.data,
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
}

EventSpecifc.Layout = ViewEventLayout;

export default EventSpecifc;
