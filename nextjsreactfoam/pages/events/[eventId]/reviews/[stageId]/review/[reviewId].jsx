import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { getSession } from "next-auth/client";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import isEmpty from "lodash/isEmpty";
import isNull from "lodash/isNull";
import capitalize from "lodash/capitalize";
import isPlainObject from "lodash/isPlainObject";
import SanitizedHTML from "react-sanitized-html";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import ExtrasForm from "@/components/common/ExtrasForm";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Note from "@/components/ui/Note";
import Panel from "@/components/ui/Panel";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import paramsSanitizer from "@/utils/paramsSanitizer";

const EditUserSubmissionReview = ({
  stage,
  review,
  reviewExtras,
  session,
  context,
}) => {
  const router = useRouter();
  const methods = useForm();
  const t = useTranslations();
  const { addToast } = useToasts();
  const [isSaving, setSaving] = useState(false);
  const [isAbstaining, setAbstaining] = useState(false);
  const userSubmission = review.user_submission;

  const handleSubmitReview = async (params) => {
    setSaving(true);
    let formData = new FormData();
    formData.append("_method", "PUT");

    if (params?.extras) {
      params.extras.forEach((extra, index) => {
        for (const [key, value] of Object.entries(paramsSanitizer(extra))) {
          /**
           * This is to append the select option's value instead
           * of the object itself.
           */
          if (isPlainObject(value) && value.value) {
            formData.append(`extras[${index}][${key}]`, value.value);
          } else {
            /**
             * or just simply append it.
             */
            formData.append(`extras[${index}][${key}]`, value);
          }
        }
      });
    }

    try {
      const response = await api({
        url: `/user-submission-reviews/${context.query.reviewId}`,
        method: "POST",
        data: formData,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
          "Content-Type": "multipart/form-data",
        },
      });

      router.push(router);
    } catch (e) {
      addToast("Failed to save review.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAbstainReview = async () => {
    setAbstaining(true);
    try {
      const response = await api({
        url: `/user-submission-reviews/${context.query.reviewId}`,
        method: "POST",
        data: { _method: "PUT", abstain: 1 },
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });

      router.push(router);
    } catch (e) {
      addToast("Failed to save review.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setAbstaining(false);
    }
  };

  const reviewPanelToolbar = (
    <>
      <Button
        color="danger"
        size="xs"
        className="mr-1"
        onClick={handleAbstainReview}
        isLoading={isAbstaining}
        disabled={isSaving}
      >
        Abstain
      </Button>
      <Button
        color="success"
        size="xs"
        onClick={methods.handleSubmit(handleSubmitReview)}
        isLoading={isSaving}
        disabled={isAbstaining}
      >
        Save Changes
      </Button>
    </>
  );

  return (
    <ContentErrorBoundary>
      <PageHeader title="Review User Submission" />
      {isEmpty(userSubmission) ? (
        <Note color="success" icon={<Icon icon="check" size="sm" />}>
          <h4>Nothing to review.</h4>
          <p className="mb-0">{t("warnings.reviews.youHaveReviewedAll")}</p>
        </Note>
      ) : (
        <>
          <Panel
            title="User Submission Details"
            color="inverse"
            maximizable
            collapsable
          >
            <div className="media mb-2">
              <div className="media-body">
                <h4 className="font-weight-bold media-heading">
                  {capitalize(userSubmission?.title)}
                </h4>
                <h6 className="f-s-12 text-black-transparent-7">{`${userSubmission?.submission?.name} | ${userSubmission?.category?.name}`}</h6>
              </div>
            </div>
          </Panel>
          <div className="row">
            <div className="col-md-4">
              <Panel
                title="Extra Information"
                color="inverse"
                maximizable
                collapsable
              >
                {userSubmission?.extra_answers?.length ? (
                  <div className="widget-list mb-2">
                    {userSubmission?.extra_answers?.map((extraAnswer) => (
                      <div className="widget-list-item">
                        <h4 className="widget-list-title">
                          <SanitizedHTML html={extraAnswer?.extra?.question} />
                        </h4>
                        <p className="widget-list-desc">
                          {extraAnswer?.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>No extra/custom questions answers.</>
                )}
              </Panel>
            </div>
            <div className="col-md-8">
              <Panel
                title="Your Review"
                color="inverse"
                toolbar={reviewPanelToolbar}
                maximizable
                collapsable
              >
                <FormProvider {...methods}>
                  <ExtrasForm
                    isSaving={isAbstaining || isSaving}
                    extras={reviewExtras}
                    answers={review?.extra_answers.map((extraAnswer) => ({
                      id: extraAnswer.id,
                      answer: extraAnswer.answer,
                      extra: extraAnswer?.review_extra?.id,
                    }))}
                  />
                </FormProvider>
              </Panel>
            </div>
          </div>
        </>
      )}
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

    const reviewsResponse = await api({
      url: `/user-submission-reviews?event=${context.params.eventId}&stage=${context.params.stageId}&user=${session.user.id}&abstained=0`,
      headers,
    });

    try {
      const stageResponse = await api({
        url: `/user-submission-stages/${context.params.stageId}?withBasicStats=1`,
        headers,
      });

      const stage = stageResponse.data.data;

      if (
        stage?.num_reviews_per_reviewer == 0 ||
        isNull(stage?.num_reviews_per_reviewer) ||
        stage?.num_reviews_per_reviewer > reviewsResponse.data.data.length
      ) {
        const reviewResponse = await api({
          url: `/user-submission-reviews/${context.params.reviewId}?withUserSubmissionData=1`,
          headers,
        });

        const reviewExtrasResponse = await api({
          url: `/user-submission-review-extras?stage=${context.params.stageId}&event=${context.params.eventId}`,
          headers,
        });

        return {
          props: {
            session,
            context: await getContextProps(context),
            stage,
            review: reviewResponse.data.data,
            reviewExtras: reviewExtrasResponse.data.data,
          },
        };
      } else {
        return {
          props: {
            session,
            context: await getContextProps(context),
            stage,
            userSubmission: {},
          },
        };
      }
    } catch (e) {
      return {
        notFound: true,
      };
    }
  }

  return {
    // next api the skipped till login user submissions
    notFound: true,
  };
};

EditUserSubmissionReview.authorozed = true;
EditUserSubmissionReview.Layout = DashboardLayout;

export default EditUserSubmissionReview;
