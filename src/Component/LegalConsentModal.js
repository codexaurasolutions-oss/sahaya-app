import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Typography from './UI/Typography';
import { Font } from '../Constants/Font';

const Checkbox = ({ checked, onToggle, label }) => (
  <TouchableOpacity
    style={styles.checkboxRow}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Typography style={styles.checkmark}>✓</Typography>}
    </View>
    <Typography size={12} style={styles.checkboxLabel}>
      {label}
    </Typography>
  </TouchableOpacity>
);

const LegalConsentModal = ({
  visible,
  onClose,
  onAccept,
  title,
  contentSections = [],
  checkboxes = [],
  acceptButtonText = 'I agree',
}) => {
  const [checkedState, setCheckedState] = useState(
    checkboxes.map(() => false)
  );
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const hasCheckboxes = checkboxes && checkboxes.length > 0;
  const allChecked = hasCheckboxes ? checkedState.every(Boolean) : true;

  const handleScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isNearBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 40;
    if (isNearBottom) {
      setHasScrolledToBottom(true);
    }
  }, []);

  const toggleCheckbox = (index) => {
    const newState = [...checkedState];
    newState[index] = !newState[index];
    setCheckedState(newState);
  };

  const handleAccept = () => {
    if (!allChecked || !hasScrolledToBottom) return;
    onAccept && onAccept();
    if (hasCheckboxes) {
      setCheckedState(checkboxes.map(() => false));
    }
    setHasScrolledToBottom(false);
  };

  const handleClose = () => {
    if (hasCheckboxes) {
      setCheckedState(checkboxes.map(() => false));
    }
    setHasScrolledToBottom(false);
    onClose && onClose();
  };

  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="fade"
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Typography
              size={18}
              type={Font.Poppins_Bold}
              style={styles.title}
            >
              {title}
            </Typography>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Typography style={styles.closeX}>✕</Typography>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            bounces={false}
            onContentSizeChange={(w, h) => {
              if (h <= 400) {
                setHasScrolledToBottom(true);
              }
            }}
          >
            {contentSections.map((section, idx) => (
              <View key={idx} style={styles.section}>
                {section.heading ? (
                  <Typography
                    size={14}
                    type={Font.Poppins_SemiBold}
                    style={styles.heading}
                  >
                    {section.heading}
                  </Typography>
                ) : null}
                {section.text ? (
                  <Typography size={12} style={styles.text}>
                    {section.text}
                  </Typography>
                ) : null}
                {section.bullets && section.bullets.length > 0 && (
                  <View style={styles.bulletList}>
                    {section.bullets.map((bullet, bi) => (
                      <View key={bi} style={styles.bulletRow}>
                        <Typography style={styles.bulletDot}>•</Typography>
                        <Typography size={12} style={styles.bulletText}>
                          {bullet}
                        </Typography>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Checkboxes */}
          {hasCheckboxes && (
            <View style={styles.checkboxSection}>
              {checkboxes.map((cb, idx) => (
                <Checkbox
                  key={cb.key || idx}
                  checked={checkedState[idx]}
                  onToggle={() => toggleCheckbox(idx)}
                  label={cb.label}
                />
              ))}
            </View>
          )}

          {/* Scroll hint */}
          {!hasScrolledToBottom && (
            <Typography size={10} style={styles.scrollHint}>
              Please scroll through the entire document to continue
            </Typography>
          )}

          {/* Accept Button */}
          <TouchableOpacity
            style={[
              styles.acceptBtn,
              (!allChecked || !hasScrolledToBottom) && styles.acceptBtnDisabled,
            ]}
            onPress={handleAccept}
            disabled={!allChecked || !hasScrolledToBottom}
            activeOpacity={0.8}
          >
            <Typography
              size={14}
              type={Font.Poppins_SemiBold}
              style={[
                styles.acceptBtnText,
                (!allChecked || !hasScrolledToBottom) &&
                  styles.acceptBtnTextDisabled,
              ]}
            >
              {acceptButtonText}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LegalConsentModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: {
    fontSize: 14,
    color: '#666',
  },
  scrollArea: {
    maxHeight: '75%',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  section: {
    marginBottom: 12,
  },
  heading: {
    color: '#1a1a2e',
    marginBottom: 4,
  },
  text: {
    color: '#333',
    lineHeight: 20,
  },
  bulletList: {
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 12,
    color: '#D98579',
    marginRight: 6,
    marginTop: 1,
  },
  bulletText: {
    color: '#333',
    lineHeight: 18,
    flex: 1,
  },
  checkboxSection: {
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#B0B0B0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#D98579',
    borderColor: '#D98579',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 14,
  },
  checkboxLabel: {
    color: '#1a1a2e',
    flex: 1,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  scrollHint: {
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  acceptBtn: {
    backgroundColor: '#27ae60', // Changed to green like user screenshot
    borderRadius: 30, // more rounded like screenshot
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  acceptBtnDisabled: {
    backgroundColor: '#A0DCA4', // Lighter green for disabled
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  acceptBtnTextDisabled: {
    color: '#fff',
    opacity: 0.6,
  },
});

