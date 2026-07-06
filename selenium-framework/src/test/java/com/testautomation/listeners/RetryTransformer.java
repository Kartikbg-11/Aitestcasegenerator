package com.testautomation.listeners;

import org.testng.IAnnotationTransformer;
import org.testng.annotations.ITestAnnotation;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;

/**
 * Automatically attaches {@link RetryAnalyzer} to every @Test method in
 * the suite, so individual test classes don't need to write
 * {@code @Test(retryAnalyzer = RetryAnalyzer.class)} on each method.
 *
 * This is the piece that makes IRetryAnalyzer usable as a suite-wide
 * policy. IRetryAnalyzer itself cannot be registered directly under
 * <listeners> in testng.xml (it isn't an ITestNGListener) — this
 * transformer is the correct mechanism, and it IS registered as a
 * <listener> because IAnnotationTransformer extends ITestNGListener.
 */
public class RetryTransformer implements IAnnotationTransformer {

    @Override
    public void transform(ITestAnnotation annotation, Class testClass,
                           Constructor testConstructor, Method testMethod) {
        annotation.setRetryAnalyzer(RetryAnalyzer.class);
    }
}
