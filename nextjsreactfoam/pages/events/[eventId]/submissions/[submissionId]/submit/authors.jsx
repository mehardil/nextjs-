import React, { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { useRouter } from "next/router";
import { useToasts } from "react-toast-notifications";
import { useTranslations } from "next-intl";
import { isNil, omit, omitBy } from "lodash";
import PageHeader from "@/components/common/PageHeader";
import SubmissionCategorisationForm from "@/components/forms/SubmissionCategorisationForm";
import UserSubmissionAuthorsForm from "@/components/forms/UserSubmissionAuthorsForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import UserSubmissionAffilliationModal from "@/components/modals/UserSubmissionAffilliationModal";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Wizard from "@/components/ui/Wizard2";
import actionTypes from "@/contexts/action-types";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import getSubmissionSteps from "@/etc/submissionSteps";
import { createAffiliation } from "@/requests/affiliations";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import { withEvent, withEventSubmission } from "@/utils/pipes";
import paramsSanitizer from "@/utils/paramsSanitizer";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";
import { fa } from "faker/lib/locales";
import isEmpty from "lodash/isEmpty";
import Note from "@/components/ui/Note";

const SubmissionTitlePage = ({
  userSubmission,
  submission,
  headers,
  session,
  event,
}) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const t = useTranslations();
  const globalDispatch = useGlobalDispatch();
  const steps = getSubmissionSteps();
  const [activeAffilliation, setActiveAffilliation] = useState();
  const [isShowAffilliationModal, setShowAffilliationModal] = useState(false);
  const [isSavingAffiliation, setSavingAffiliation] = useState(false);

  const methods = useForm({
    defaultValues: {
      authors: userSubmission?.authors?.map((authors) =>
        omitBy(
          {
            ...authors,
            email: {
              label: authors?.email,
              value: authors?.email,
            },
            affiliations: authors?.affiliations?.map((affiliation) => ({
              label: affiliation?.name,
              value: affiliation?.id,
            })),
          },
          isNil
        )
      ),
    },
  });

  const toggleAffilliationModal = (selectedAuthor) => {
    alert(selectedAuthor);
    if (!selectedAuthor) {
      addToast("Select Author Email first", {
        appearance: "error",
        autoDismiss: true,
      });
      return false;
    }

    setActiveAffilliation({
      user: selectedAuthor,
    });
    setShowAffilliationModal(!!selectedAuthor);
  };

  /**
   * Handles the create and update submissions of affiliation form
   * which to be used in Authors affiliation select field.
   *
   * @param {object} params
   */
  const handleAffilliationSubmit = async (params) => {
    try {
      setSavingAffiliation(true);
      const affiliationResponse = await createAffiliation(
        session.accessToken,
        params
      );
      setShowAffilliationModal(false);
      addToast(
        t("common.notifs.successfullyCreated", {
          entityName: affiliationResponse.data.data.name,
          entity: t("common.affiliation", { entries: 1 }),
        })
      );
    } catch (e) {
      addToast(
        t(
          "common.notifs.failedToCreate",
          { entityName: "", entity: t("common.affiliation", { entries: 1 }) },
          { appearance: "error", autoDismiss: true }
        )
      );
    } finally {
      setSavingAffiliation(false);
    }
  };

  /**
   * Handles the update submission of authors. This step
   * only "updates" (not create) user submission or abstrakt.
   *
   * @param {object} param0
   * @param {object} param1
   */
  const handleUpdate = async ({ authors }, { redirectToNextStep }) => {
    const formData = new FormData();
    formData.append("_method", "PUT");

    const formattedAuthors = authors?.forEach((author, authorIndex) => {
      /**
       * Appends all the normal parameters of an author
       * and assign them into indexes.
       */
      for (const [key, value] of Object.entries(
        paramsSanitizer(omit(author, ["affiliations"]))
      )) {
        if (key == "email") {
          formData.append(`authors[${authorIndex}][${key}]`, value?.value);
        } else {
          formData.append(`authors[${authorIndex}][${key}]`, value);
        }
      }

      /**
       * Checks if author affiliations are defined. If so,
       * assigns each affiliations keys into multi-deminseional array.
       */
      if (
        !isNil(author["affiliations"]) &&
        Array.isArray(author["affiliations"])
      ) {
        author["affiliations"].forEach((affiliation, affIndex) => {
          formData.append(
            `authors[${authorIndex}][affiliations][${affIndex}]`,
            affiliation?.value
          );
        });

        /**
         * Else, returns an empty array.
         */
      } else {
        formData.append(`authors[${authorIndex}][affiliations]`, []);
      }
    });

    try {
      const userSubmissionResponse = await api({
        headers,
        method: "POST",
        data: formData,
        headers: { ...headers, "Content-Type": "multipart/form-data" },
        url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSION, {
          eventId: router.query.eventId,
          submissionId: router.query.submissionId,
          userSubmissionId: userSubmission.id,
        }),
      });

      redirectToNextStep({
        query: {
          userSubmissionId: userSubmissionResponse.data.data.id,
        },
      });
    } catch (e) {
      addToast(
        t("common.notifs.failedToUpdate", {
          entityName: t("common.userSubmission", { entries: 1 }),
          entity: userSubmission.title,
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    }
  };

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, globalDispatch]);

  return (
    <>
      {!!isShowAffilliationModal && (
        <UserSubmissionAffilliationModal
          defaultValues={activeAffilliation}
          isShow={isShowAffilliationModal}
          onHide={() => toggleAffilliationModal(false, undefined)}
          onSubmit={handleAffilliationSubmit}
          isSaving={isSavingAffiliation}
        />
      )}
      <FormProvider {...methods}>
        <Wizard
          {...{ steps }}
          onPrevious={({ redirectToPreviousStep }) => {
            redirectToPreviousStep({
              query: { userSubmissionId: userSubmission?.id },
            });
          }}
          onNext={({ redirectToNextStep }) =>
            methods.handleSubmit((params) => {
              methods.clearErrors();

              if (isEmpty(params?.authors)) {
                methods.setError("blocker", {
                  type: "custom",
                  message: "required",
                });

                return false;
              }

              handleUpdate(params, { redirectToNextStep });
            })()
          }
        >
          <UserSubmissionAuthorsForm
            submission={submission}
            user={userSubmission?.user?.id}
            onCreateAffilliation={toggleAffilliationModal}
          />
        </Wizard>
      </FormProvider>
    </>
  );
};

export const getServerSideProps = (context) =>
  serverSidePipe(context, [withEvent, withEventSubmission])(
    async (context, pipeProps) => {
      const session = await getSession(context);

      if (session) {
        if (context.query.userSubmissionId) {
          const headers = {
            Authorization: `Bearer ${session.accessToken}`,
            "X-Tenant": getTenant(context.req),
          };

          const userSubmissionResponse = await api({
            headers,
            url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSION, {
              eventId: context.query.eventId,
              submissionId: context.query.submissionId,
              userSubmissionId: context.query.userSubmissionId,
              query: {
                include: "userSubmissionUser,authors,authors.affiliations",
              },
            }),
          });

          return {
            props: {
              headers,
              session,
              context: await getContextProps(context),
              userSubmission: userSubmissionResponse.data.data,
              ...pipeProps,
            },
          };
        }

        return {
          redirect: {
            permanent: false,
            destination: interpolatePath(
              paths.DELEGATE_SUBMISSIONS_SUBMIT_TERMS,
              {
                eventId: context.query.eventId,
                submissionId: context.query.submissionId,
              }
            ),
          },
          props: {},
        };
      }

      return {
        notFound: true,
      };
    }
  );

SubmissionTitlePage.authorized = true;
SubmissionTitlePage.Layout = DashboardLayout;

export default SubmissionTitlePage;
